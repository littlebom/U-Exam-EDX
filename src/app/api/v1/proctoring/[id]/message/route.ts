import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { handleApiError, AppError } from "@/lib/errors";
import { logProctoringEvent } from "@/services/proctoring.service";
import { emitCandidateEvent } from "@/lib/sse-emitter";
import { proctoringMessageSchema } from "@/lib/validations/proctoring";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/proctoring/[id]/message
 *
 * Proctor sends a warning message to a candidate during exam.
 * Auth: proctoring:monitor permission.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    await requirePermission("proctoring:monitor");
    const { id: proctoringSessionId } = await context.params;

    const body = await req.json();
    const { message } = proctoringMessageSchema.parse(body);

    // Get exam session ID for SSE channel
    const proctoringSession = await prisma.proctoringSession.findUnique({
      where: { id: proctoringSessionId },
      select: { examSessionId: true },
    });

    if (!proctoringSession) {
      throw new AppError("NOT_FOUND", "ไม่พบ proctoring session", 404);
    }

    // Log as proctoring event for audit trail
    await logProctoringEvent(proctoringSessionId, {
      type: "PROCTOR_MESSAGE",
      severity: "MEDIUM",
      metadata: { message },
    });

    // Send to candidate via SSE
    emitCandidateEvent(proctoringSession.examSessionId, {
      event: "proctor-message",
      data: { message, timestamp: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      data: { sent: true, examSessionId: proctoringSession.examSessionId },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
