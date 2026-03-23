import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ scheduleId: string }> };

// GET /api/v1/exams/tracking/[scheduleId] — รายชื่อผู้สอบในรอบนั้น + สถานะ
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requirePermission("exam:list");
    const { scheduleId } = await context.params;

    // Get schedule info
    const schedule = await prisma.examSchedule.findFirst({
      where: { id: scheduleId, exam: { tenantId: ctx.tenantId } },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
        exam: { select: { id: true, title: true, duration: true, passingScore: true } },
        testCenter: { select: { id: true, name: true } },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: { message: "ไม่พบรอบสอบ" } },
        { status: 404 }
      );
    }

    // Get all registrations for this schedule
    const registrations = await prisma.registration.findMany({
      where: { examScheduleId: scheduleId, status: "CONFIRMED" },
      select: {
        id: true,
        candidateId: true,
        candidate: { select: { id: true, name: true, email: true } },
      },
    });

    // Get all sessions for this schedule
    const sessions = await prisma.examSession.findMany({
      where: { examScheduleId: scheduleId },
      select: {
        id: true,
        candidateId: true,
        status: true,
        startedAt: true,
        submittedAt: true,
        score: true,
        isPassed: true,
      },
    });

    const sessionMap = new Map(sessions.map((s) => [s.candidateId, s]));

    // Build candidate list with status
    type CandidateStatus = "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT" | "ABSENT";
    const candidates = registrations.map((reg) => {
      const session = sessionMap.get(reg.candidateId);

      let status: CandidateStatus = "ABSENT";
      if (session) {
        status = session.status as CandidateStatus;
      }

      return {
        id: reg.candidateId,
        name: reg.candidate.name,
        email: reg.candidate.email,
        registrationId: reg.id,
        sessionId: session?.id ?? null,
        status,
        startedAt: session?.startedAt ?? null,
        submittedAt: session?.submittedAt ?? null,
        score: session?.score ?? null,
        isPassed: session?.isPassed ?? null,
      };
    });

    // Stats
    const stats = {
      registered: registrations.length,
      inProgress: candidates.filter((c) => c.status === "IN_PROGRESS").length,
      submitted: candidates.filter((c) => c.status === "SUBMITTED" || c.status === "TIMED_OUT").length,
      absent: candidates.filter((c) => c.status === "ABSENT").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        schedule,
        stats,
        candidates,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
