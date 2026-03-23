import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";
import { sendNotification } from "@/services/notification.service";

const schema = z.object({
  scheduleId: z.string().min(1),
});

// POST — ส่ง EXAM_REMINDER ให้ผู้สอบทุกคนในรอบสอบนั้น
export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("exam:manage");
    const body = await req.json();
    const { scheduleId } = schema.parse(body);

    // Get schedule with registrations
    const schedule = await prisma.examSchedule.findFirst({
      where: { id: scheduleId, tenantId: session.tenantId },
      include: {
        exam: { select: { title: true } },
        registrations: {
          where: { status: "CONFIRMED" },
          select: { candidateId: true },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: { message: "ไม่พบรอบสอบ" } },
        { status: 404 }
      );
    }

    const examTitle = schedule.exam?.title ?? "สอบ";
    const startDate = new Date(schedule.startDate).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    let sentCount = 0;
    for (const reg of schedule.registrations) {
      try {
        await sendNotification({
          tenantId: session.tenantId,
          userId: reg.candidateId,
          type: "EXAM_REMINDER",
          title: "เตือน: มีสอบเร็ว ๆ นี้",
          message: `วิชา "${examTitle}" กำหนดสอบวันที่ ${startDate} กรุณาเตรียมตัวให้พร้อม`,
          link: "/profile/my-exams",
        });
        sentCount++;
      } catch (err) {
        console.error("[exam-reminder] Failed for user:", reg.candidateId, err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `ส่งแจ้งเตือนให้ผู้สอบ ${sentCount} คนสำเร็จ`,
        sentCount,
        totalRegistrations: schedule.registrations.length,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
