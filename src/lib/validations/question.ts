import { z } from "zod";

// ============================================================
// Enums
// ============================================================
export const QuestionType = z.enum([
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "ESSAY",
  "FILL_IN_BLANK",
  "MATCHING",
  "ORDERING",
  "IMAGE_BASED",
]);
export type QuestionType = z.infer<typeof QuestionType>;

export const DifficultyLevel = z.enum(["EASY", "MEDIUM", "HARD"]);
export type DifficultyLevel = z.infer<typeof DifficultyLevel>;

export const QuestionStatus = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);
export type QuestionStatus = z.infer<typeof QuestionStatus>;

// ============================================================
// Create Question
// ============================================================
const mediaAttachmentSchema = z.object({
  mediaFileId: z.string().uuid(),
  caption: z.string().max(255).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

export const createQuestionSchema = z.object({
  type: QuestionType,
  difficulty: DifficultyLevel.default("MEDIUM"),
  content: z.union([
    z.object({ type: z.literal("text"), text: z.string() }),        // Legacy format
    z.object({ type: z.literal("doc"), content: z.array(z.any()) }), // Tiptap JSON
  ]),
  options: z.any().optional(), // JSON array of options
  correctAnswer: z.any().optional(), // JSON correct answer
  explanation: z.string().max(5000).optional().nullable(),
  points: z.number().min(0.5).max(100).default(1),
  subjectId: z.string().uuid().optional().nullable(),
  questionGroupId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional().default([]),
  status: QuestionStatus.default("DRAFT"),
  metadata: z.any().optional().nullable(),
  media: z.array(mediaAttachmentSchema).max(11).optional().default([]),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

// ============================================================
// Update Question
// ============================================================
export const updateQuestionSchema = createQuestionSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;

// ============================================================
// Question Filter
// ============================================================
export const questionFilterSchema = z.object({
  search: z.string().optional(),
  type: QuestionType.optional(),
  difficulty: DifficultyLevel.optional(),
  status: QuestionStatus.optional(),
  subjectId: z.string().uuid().optional(),
  questionGroupId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export type QuestionFilterInput = z.infer<typeof questionFilterSchema>;
