import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";
import { STAFF_ROLES } from "@/lib/constants";
import { z } from "zod";
import { sendNotification } from "@/services/notification.service";

const schema = z.object({
  title: z.string().min(1, "กรุณาระบุหัวข้อ").max(200),
  message: z.string().min(1, "กรุณาระบุข้อความ").max(2000),
  link: z.string().optional(),
  targetRole: z.enum(["ALL", "CANDIDATE", "STAFF"]).default("ALL"),
});

// POST — ส่งประกาศระบบให้ผู้ใช้ทั้งหมดใน tenant
export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("tenant:settings");
    const body = await req.json();
    const { title, message, link, targetRole } = schema.parse(body);

    // Build role filter
    const roleFilter: string[] = [];
    if (targetRole === "CANDIDATE") {
      roleFilter.push("CANDIDATE");
    } else if (targetRole === "STAFF") {
      roleFilter.push(...STAFF_ROLES);
    }

    // Get all users in this tenant
    const userTenants = await prisma.userTenant.findMany({
      where: {
        tenantId: session.tenantId,
        ...(roleFilter.length > 0
          ? { role: { name: { in: roleFilter } } }
          : {}),
      },
      select: { userId: true },
    });

    let sentCount = 0;
    for (const ut of userTenants) {
      try {
        await sendNotification({
          tenantId: session.tenantId,
          userId: ut.userId,
          type: "SYSTEM_ANNOUNCEMENT",
          title,
          message,
          link: link || undefined,
        });
        sentCount++;
      } catch (err) {
        console.error("[announce] Failed for user:", ut.userId, err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `ส่งประกาศให้ผู้ใช้ ${sentCount} คนสำเร็จ`,
        sentCount,
        totalUsers: userTenants.length,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
