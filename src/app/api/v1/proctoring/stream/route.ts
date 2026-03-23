import { requirePermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/errors";
import { sseEmitter, type SSEEvent } from "@/lib/sse-emitter";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/proctoring/stream
 *
 * SSE endpoint for admin proctoring dashboard.
 * Streams real-time proctoring events (new events, incidents, status changes).
 * Auth: proctoring:monitor permission.
 */
export async function GET() {
  try {
    await requirePermission("proctoring:monitor");

    const encoder = new TextEncoder();
    let closed = false;

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection event
        controller.enqueue(
          encoder.encode(`event: connected\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`)
        );

        // Heartbeat every 30 seconds
        const heartbeat = setInterval(() => {
          if (closed) return;
          try {
            controller.enqueue(
              encoder.encode(`event: heartbeat\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`)
            );
          } catch {
            // Stream closed
            clearInterval(heartbeat);
          }
        }, 30_000);

        // Listen for proctoring events
        const onEvent = (event: SSEEvent) => {
          if (closed) return;
          try {
            controller.enqueue(
              encoder.encode(`event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`)
            );
          } catch {
            // Stream closed
          }
        };

        sseEmitter.on("proctoring", onEvent);

        // Cleanup on close
        const cleanup = () => {
          closed = true;
          clearInterval(heartbeat);
          sseEmitter.off("proctoring", onEvent);
        };

        // Handle abort signal (client disconnects)
        // We store cleanup to call from cancel()
        (controller as unknown as Record<string, () => void>).__cleanup = cleanup;
      },
      cancel() {
        closed = true;
        // Cleanup is handled by the closed flag
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disable nginx buffering
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
