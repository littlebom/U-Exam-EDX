import { EventEmitter } from "events";

/**
 * Global SSE event emitter (singleton).
 * Services emit events → SSE routes stream to connected clients.
 *
 * Pattern: same as prisma.ts global singleton to survive HMR.
 */

export interface SSEEvent {
  /** Event name (maps to SSE "event:" field) */
  event: string;
  /** JSON-serializable data */
  data: unknown;
  /** Optional: scope to a specific proctoring session */
  sessionId?: string;
  /** Optional: scope to a specific exam session (for candidate SSE) */
  examSessionId?: string;
}

const globalForSSE = globalThis as unknown as {
  sseEmitter: EventEmitter | undefined;
};

export const sseEmitter = globalForSSE.sseEmitter ?? new EventEmitter();

// Increase max listeners (many admin clients may connect)
sseEmitter.setMaxListeners(100);

if (process.env.NODE_ENV !== "production") {
  globalForSSE.sseEmitter = sseEmitter;
}

// ── Helper: emit proctoring event to admin dashboard ──
export function emitProctoringEvent(event: SSEEvent) {
  sseEmitter.emit("proctoring", event);
}

// ── Helper: emit message to specific candidate ──
export function emitCandidateEvent(examSessionId: string, event: SSEEvent) {
  sseEmitter.emit(`candidate:${examSessionId}`, event);
}
