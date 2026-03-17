import { z } from "zod";

// ─── Enums ──────────────────────────────────────────────────────────
export const SessionStatus = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "SUBMITTED",
  "TIMED_OUT",
]);

export const EventType = z.enum([
  "BLUR",
  "FOCUS",
  "COPY",
  "PASTE",
  "SCREENSHOT",
  "TAB_SWITCH",
  "FULLSCREEN_EXIT",
]);

// ─── Start Session ──────────────────────────────────────────────────
export const startSessionSchema = z.object({
  examScheduleId: z.string().uuid(),
  ipAddress: z.string().max(50).optional(),
  userAgent: z.string().max(500).optional(),
});

// ─── Submit Answer ──────────────────────────────────────────────────
export const submitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  answer: z.unknown().optional(),
  timeSpent: z.number().int().min(0).optional(),
});

// ─── Flag Question ──────────────────────────────────────────────────
export const flagQuestionSchema = z.object({
  questionId: z.string().uuid(),
  isFlagged: z.boolean(),
});

// ─── Auto-save (batch) ─────────────────────────────────────────────
export const autoSaveSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      answer: z.unknown().optional(),
      timeSpent: z.number().int().min(0).optional(),
    })
  ),
  timeRemaining: z.number().int().min(0).optional(),
});

// ─── Log Event ──────────────────────────────────────────────────────
export const logEventSchema = z.object({
  type: EventType,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const logEventsSchema = z.object({
  events: z.array(
    z.object({
      type: EventType,
      metadata: z.record(z.string(), z.unknown()).optional(),
      timestamp: z.string().datetime().optional(),
    })
  ),
});

// ─── Session Filter ─────────────────────────────────────────────────
export const sessionFilterSchema = z.object({
  examScheduleId: z.string().uuid().optional(),
  candidateId: z.string().uuid().optional(),
  status: SessionStatus.optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Types ──────────────────────────────────────────────────────────
export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type FlagQuestionInput = z.infer<typeof flagQuestionSchema>;
export type AutoSaveInput = z.infer<typeof autoSaveSchema>;
export type LogEventInput = z.infer<typeof logEventSchema>;
export type LogEventsInput = z.infer<typeof logEventsSchema>;
export type SessionFilter = z.infer<typeof sessionFilterSchema>;
