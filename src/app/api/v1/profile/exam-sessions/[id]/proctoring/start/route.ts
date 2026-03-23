import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/get-session";
import { handleApiError, AppError } from "@/lib/errors";
import { startProctoringSession } from "@/services/proctoring.service";
import { startProctoringSchema } from "@/lib/validations/proctoring";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/profile/exam-sessions/[id]/proctoring/start
 *
 * Candidate starts a proctoring session when beginning an exam.
 * Auth: candidate who owns the exam session.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionContext();
    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { id: examSessionId } = await context.params;

    // Verify ownership
    const examSession = await prisma.examSession.findFirst({
      where: { id: examSessionId, candidateId: session.user.id },
      select: { id: true, status: true },
    });

    if (!examSession) {
      throw new AppError("FORBIDDEN", "ไม่มีสิทธิ์เข้าถึง session นี้", 403);
    }

    if (examSession.status !== "IN_PROGRESS") {
      throw new AppError("BAD_REQUEST", "Exam session ไม่ได้อยู่ในสถานะ IN_PROGRESS", 400);
    }

    const body = await req.json().catch(() => ({}));
    const options = startProctoringSchema.parse(body);

    const proctoringSession = await startProctoringSession(examSessionId, options);

    return NextResponse.json(
      { success: true, data: proctoringSession },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
