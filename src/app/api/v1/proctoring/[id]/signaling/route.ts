import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/get-session";
import { handleApiError, AppError } from "@/lib/errors";
import { emitProctoringEvent, emitCandidateEvent } from "@/lib/sse-emitter";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const signalingSchema = z.object({
  type: z.enum(["offer", "answer", "ice-candidate"]),
  payload: z.unknown(),
  from: z.enum(["candidate", "proctor"]),
});

/**
 * POST /api/v1/proctoring/[id]/signaling
 *
 * WebRTC signaling relay for live video streaming.
 * Both candidates and proctors send signaling messages here;
 * the server relays them to the other party via SSE.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionContext();
    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { id: proctoringSessionId } = await context.params;
    const body = await req.json();
    const data = signalingSchema.parse(body);

    // Get the proctoring session to find exam session ID
    const proctoringSession = await prisma.proctoringSession.findUnique({
      where: { id: proctoringSessionId },
      select: { examSessionId: true },
    });

    if (!proctoringSession) {
      throw new AppError("NOT_FOUND", "ไม่พบ proctoring session", 404);
    }

    // Relay signaling message to the other party
    if (data.from === "candidate") {
      // Candidate → Proctor (via admin SSE channel)
      emitProctoringEvent({
        event: "webrtc-signal",
        data: {
          proctoringSessionId,
          type: data.type,
          payload: data.payload,
          from: "candidate",
        },
        sessionId: proctoringSessionId,
      });
    } else {
      // Proctor → Candidate (via candidate SSE channel)
      emitCandidateEvent(proctoringSession.examSessionId, {
        event: "webrtc-signal",
        data: {
          type: data.type,
          payload: data.payload,
          from: "proctor",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
