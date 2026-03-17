import { z } from "zod";

// ─── Enums ──────────────────────────────────────────────────────────

export const GradeStatus = z.enum(["DRAFT", "GRADING", "COMPLETED", "PUBLISHED"]);

export const AppealStatus = z.enum(["PENDING", "APPROVED", "REJECTED"]);

// ─── Grade Answer (manual grading per question) ─────────────────────

export const gradeAnswerSchema = z.object({
  answerId: z.string().uuid(),
  score: z.number().min(0),
  maxScore: z.number().min(0),
  feedback: z.string().max(2000).optional(),
  rubricScores: z
    .array(
      z.object({
        criteriaId: z.string().uuid(),
        score: z.number().min(0),
        maxScore: z.number().min(0),
      })
    )
    .optional(),
  gradingDurationMs: z.number().int().min(0).optional(), // time tracking
});

// ─── Batch Grade (grade multiple answers at once) ───────────────────

export const batchGradeSchema = z.object({
  answers: z.array(gradeAnswerSchema).min(1),
});

// ─── Publish Grade ──────────────────────────────────────────────────

export const publishGradeSchema = z.object({
  sessionId: z.string().uuid(),
});

// ─── Bulk Publish ───────────────────────────────────────────────────

export const bulkPublishSchema = z.object({
  gradeIds: z.array(z.string().uuid()).min(1),
});

// ─── Score Adjustment ───────────────────────────────────────────────

export const adjustScoreSchema = z.object({
  answerId: z.string().uuid(),
  newScore: z.number().min(0),
  reason: z.string().min(1).max(500),
});

// ─── Rubric Level Descriptor ─────────────────────────────────────────

export const rubricLevelSchema = z.object({
  label: z.string().min(1).max(100),
  minScore: z.number().min(0),
  maxScore: z.number().min(0),
  description: z.string().max(500).optional(),
});

// ─── Rubric ─────────────────────────────────────────────────────────

const criteriaBaseSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  maxScore: z.number().min(0),
  sortOrder: z.number().int().min(0).default(0),
  levels: z.array(rubricLevelSchema).optional(),
});

export const createRubricSchema = z.object({
  examId: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  criteria: z.array(criteriaBaseSchema).min(1),
});

export const updateRubricSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
  criteria: z
    .array(
      criteriaBaseSchema.extend({
        id: z.string().uuid().optional(), // existing criteria to update
      })
    )
    .min(1)
    .optional(),
});

// ─── Appeal ─────────────────────────────────────────────────────────

export const createAppealSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().uuid().optional(), // null = appeal entire grade
  originalScore: z.number().min(0),
  reason: z.string().min(10).max(2000),
});

export const resolveAppealSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  response: z.string().min(1).max(2000),
  newScore: z.number().min(0).optional(), // required if approved
});

// ─── Filters ────────────────────────────────────────────────────────

export const gradeFilterSchema = z.object({
  examId: z.string().uuid().optional(),
  status: GradeStatus.optional(),
  isPassed: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export const gradingQueueFilterSchema = z.object({
  examId: z.string().uuid().optional(),
  questionType: z.string().optional(), // ESSAY, SHORT_ANSWER, etc.
  status: z.enum(["pending", "graded"]).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export const appealFilterSchema = z.object({
  sessionId: z.string().uuid().optional(),
  status: AppealStatus.optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export const rubricFilterSchema = z.object({
  examId: z.string().uuid().optional(),
  isActive: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Types ──────────────────────────────────────────────────────────

export type GradeAnswerInput = z.infer<typeof gradeAnswerSchema>;
export type BatchGradeInput = z.infer<typeof batchGradeSchema>;
export type PublishGradeInput = z.infer<typeof publishGradeSchema>;
export type BulkPublishInput = z.infer<typeof bulkPublishSchema>;
export type AdjustScoreInput = z.infer<typeof adjustScoreSchema>;
export type CreateRubricInput = z.infer<typeof createRubricSchema>;
export type UpdateRubricInput = z.infer<typeof updateRubricSchema>;
export type CreateAppealInput = z.infer<typeof createAppealSchema>;
export type ResolveAppealInput = z.infer<typeof resolveAppealSchema>;
export type GradeFilter = z.infer<typeof gradeFilterSchema>;
export type GradingQueueFilter = z.infer<typeof gradingQueueFilterSchema>;
export type AppealFilter = z.infer<typeof appealFilterSchema>;
export type RubricFilter = z.infer<typeof rubricFilterSchema>;
