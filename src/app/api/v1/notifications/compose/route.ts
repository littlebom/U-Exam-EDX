import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";
import { STAFF_ROLES } from "@/lib/constants";
import { z } from "zod";
import { sendEmail } from "@/lib/mailer";
import { renderNotificationEmail } from "@/lib/email-templates";

const schema = z.object({
  to: z.enum(["all", "candidates", "by_exam", "staff", "custom"]),
  customEmails: z.array(z.string().email()).optional(),
  examId: z.string().optional(),
  subject: z.string().min(1, "กรุณาระบุหัวข้อ").max(200),
  message: z.string().min(1, "กรุณาระบุข้อความ").max(5000),
  sendInApp: z.boolean().default(true),
});

// POST — ส่งอีเมลโดยตรงจาก Admin
export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("tenant:settings");
    const body = await req.json();
    const { to, customEmails, examId, subject, message, sendInApp } = schema.parse(body);

    let emails: string[] = [];
    let userIds: string[] = [];

    if (to === "custom") {
      emails = customEmails ?? [];
    } else if (to === "by_exam") {
      // ── ผู้สมัครรายวิชา ──
      if (!examId) {
        return NextResponse.json(
          { success: false, error: { message: "กรุณาเลือกวิชา" } },
          { status: 400 }
        );
      }

      // Find all registrations for schedules of this exam
      const registrations = await prisma.registration.findMany({
        where: {
          tenantId: session.tenantId,
          examSchedule: { examId },
          status: { in: ["PENDING", "CONFIRMED", "WAITING_LIST"] },
        },
        select: {
          candidateId: true,
          candidate: { select: { email: true } },
        },
        distinct: ["candidateId"],
      });

      userIds = registrations.map((r) => r.candidateId);
      emails = registrations
        .map((r) => r.candidate?.email)
        .filter((e): e is string => !!e);

      // Send in-app notifications
      if (sendInApp) {
        const { sendNotification } = await import("@/services/notification.service");
        for (const uid of userIds) {
          sendNotification({
            tenantId: session.tenantId,
            userId: uid,
            type: "SYSTEM_ANNOUNCEMENT",
            title: subject,
            message,
          }).catch((err) => console.error("[compose-inapp]", err));
        }
      }
    } else {
      // Build role filter
      const roleFilter: string[] = [];
      if (to === "candidates") {
        roleFilter.push("CANDIDATE");
      } else if (to === "staff") {
        roleFilter.push(...STAFF_ROLES);
      }

      const userTenants = await prisma.userTenant.findMany({
        where: {
          tenantId: session.tenantId,
          ...(roleFilter.length > 0
            ? { role: { name: { in: roleFilter } } }
            : {}),
        },
        select: {
          userId: true,
          user: { select: { email: true } },
        },
      });

      // Also create in-app notifications if requested
      if (sendInApp) {
        const { sendNotification } = await import("@/services/notification.service");
        for (const ut of userTenants) {
          sendNotification({
            tenantId: session.tenantId,
            userId: ut.userId,
            type: "SYSTEM_ANNOUNCEMENT",
            title: subject,
            message,
          }).catch((err) => console.error("[compose-inapp]", err));
        }
      }

      emails = userTenants
        .map((ut) => ut.user?.email)
        .filter((e): e is string => !!e);
    }

    // Send emails
    const html = renderNotificationEmail({
      title: subject,
      message,
      type: "SYSTEM_ANNOUNCEMENT",
    });

    let sentCount = 0;
    let failCount = 0;

    for (const email of emails) {
      try {
        await sendEmail({
          to: email,
          subject: `[U-Exam] ${subject}`,
          html,
          tenantId: session.tenantId,
        });
        sentCount++;
      } catch (err) {
        failCount++;
        console.error("[compose-email] Failed:", email, err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `ส่งอีเมล ${sentCount} จาก ${emails.length} สำเร็จ${failCount > 0 ? ` (ล้มเหลว ${failCount})` : ""}`,
        sentCount,
        failCount,
        totalEmails: emails.length,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
