import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { startExam } from "@/services/exam-session.service";
import { handleApiError, AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getClientIp, isIpAllowed } from "@/lib/ip-utils";
import { createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 3 });

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const rl = limiter.check(request);
  if (!rl.success) return rl.response!;

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

    // 2. Check time window for ALL exam types (online + onsite)
    const schedule = await prisma.examSchedule.findUnique({
      where: { id: id },
      select: {
        testCenterId: true,
        startDate: true,
        endDate: true,
        settings: true,
        testCenter: { select: { allowedIps: true } },
      },
    });

    if (schedule) {
      const now = new Date();
      if (now < schedule.startDate) {
        throw new AppError("VALIDATION_ERROR", "ยังไม่ถึงเวลาเข้าสอบ", 400);
      }
      if (now > schedule.endDate) {
        throw new AppError("VALIDATION_ERROR", "เลยเวลาเข้าสอบแล้ว", 400);
      }
    }

    // 3. Check IP restriction (Onsite exam with requireIpCheck enabled)
    if (schedule?.testCenterId) {
      const settings = schedule.settings as Record<string, unknown> | null;
      const checkinSettings = settings?.checkin as Record<string, unknown> | undefined;
      const requireIpCheck = !!(checkinSettings?.requireIpCheck);

      if (requireIpCheck) {
        const clientIp = getClientIp(request);
        const allowedIps = schedule.testCenter?.allowedIps as string[] | null;

        if (!isIpAllowed(clientIp, allowedIps)) {
          throw new AppError(
            "FORBIDDEN",
            `ไม่สามารถเข้าสอบจาก IP นี้ได้ (${clientIp ?? "unknown"}) — กรุณาใช้เครือข่ายของศูนย์สอบ`,
            403
          );
        }
      }
    }

    // ─── Call existing service ────────────────────────────────────

    const clientIp = getClientIp(request);

    const result = await startExam(candidateId, {
      examScheduleId: id,
      ipAddress: clientIp,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    // Audit log
    const { logExamEvent } = await import("@/services/audit-log.service");
    logExamEvent("EXAM_START", {
      userId: candidateId,
      target: `ExamSession:${result.id}`,
      ipAddress: clientIp,
      detail: { scheduleId: id },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
