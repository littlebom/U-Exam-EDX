import { NextRequest } from "next/server";
import { getSessionContext } from "@/lib/get-session";
import { handleApiError, AppError } from "@/lib/errors";
import { sseEmitter, type SSEEvent } from "@/lib/sse-emitter";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/profile/exam-sessions/[id]/proctoring/stream
 *
 * SSE endpoint for candidate during exam.
 * Streams: proctor messages, force-submit commands.
 * Auth: candidate who owns the exam session.
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionContext();
    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { id: examSessionId } = await context.params;

    // Verify ownership
    const examSession = await prisma.examSession.findFirst({
      where: { id: examSessionId, candidateId: session.user.id },
      select: { id: true },
    });

    if (!examSession) {
      throw new AppError("FORBIDDEN", "ไม่มีสิทธิ์เข้าถึง session นี้", 403);
    }

    const encoder = new TextEncoder();
    let closed = false;
    const channelName = `candidate:${examSessionId}`;
    let heartbeat: ReturnType<typeof setInterval> | null = null;

    const onEvent = (event: SSEEvent) => {
      if (closed) return;
      try {
        streamController?.enqueue(
          encoder.encode(`event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`)
        );
      } catch {
        // Stream closed
      }
    };

    const cleanup = () => {
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      sseEmitter.off(channelName, onEvent);
    };

    let streamController: ReadableStreamDefaultController | null = null;

    const stream = new ReadableStream({
      start(controller) {
        streamController = controller;
        controller.enqueue(
          encoder.encode(`event: connected\ndata: ${JSON.stringify({ examSessionId })}\n\n`)
        );

        heartbeat = setInterval(() => {
          if (closed) return;
          try {
            controller.enqueue(
              encoder.encode(`event: heartbeat\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`)
            );
          } catch {
            cleanup();
          }
        }, 30_000);

        sseEmitter.on(channelName, onEvent);
      },
      cancel() {
        cleanup();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
