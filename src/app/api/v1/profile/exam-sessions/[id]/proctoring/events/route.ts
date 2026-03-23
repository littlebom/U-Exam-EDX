import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/get-session";
import { handleApiError, AppError } from "@/lib/errors";
import { logProctoringEvent } from "@/services/proctoring.service";
import { logProctoringEventSchema } from "@/lib/validations/proctoring";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/profile/exam-sessions/[id]/proctoring/events
 *
 * Candidate logs a proctoring event (tab switch, face not detected, etc.)
 * Auth: candidate who owns the exam session.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionContext();
    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { id: examSessionId } = await context.params;

    // Get proctoring session via exam session ownership
    const proctoringSession = await prisma.proctoringSession.findFirst({
      where: {
        examSession: {
          id: examSessionId,
          candidateId: session.user.id,
        },
      },
      select: { id: true },
    });

    if (!proctoringSession) {
      throw new AppError("NOT_FOUND", "ไม่พบ proctoring session", 404);
    }

    const body = await req.json();
    const data = logProctoringEventSchema.parse(body);

    const event = await logProctoringEvent(proctoringSession.id, data);

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
