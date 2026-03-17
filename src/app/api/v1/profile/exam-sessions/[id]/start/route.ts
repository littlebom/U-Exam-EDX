import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { startExam } from "@/services/exam-session.service";
import { handleApiError, AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { id } = await context.params;
    const candidateId = session.user.id;

    // ─── Candidate-specific validations ──────────────────────────

    // 1. Check CONFIRMED registration
    const registration = await prisma.registration.findFirst({
      where: {
        examScheduleId: id,
        candidateId,
        status: "CONFIRMED",
      },
    });

    if (!registration) {
      throw new AppError(
        "FORBIDDEN",
        "คุณยังไม่ได้ลงทะเบียนสอบหรือการลงทะเบียนยังไม่ได้รับการยืนยัน",
        403
      );
    }

    // 2. Check time window for online exam
    const schedule = await prisma.examSchedule.findUnique({
      where: { id: id },
      select: { testCenterId: true, startDate: true, endDate: true },
    });

    if (schedule && !schedule.testCenterId) {
      const now = new Date();
      if (now < schedule.startDate) {
        throw new AppError("VALIDATION_ERROR", "ยังไม่ถึงเวลาเข้าสอบ", 400);
      }
      if (now > schedule.endDate) {
        throw new AppError("VALIDATION_ERROR", "เลยเวลาเข้าสอบแล้ว", 400);
      }
    }

    // ─── Call existing service ────────────────────────────────────

    const result = await startExam(candidateId, {
      examScheduleId: id,
      ipAddress:
        request.headers.get("x-forwarded-for") ??
        request.headers.get("x-real-ip") ??
        undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
