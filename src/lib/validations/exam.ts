import { z } from "zod";

// ── Enums ──────────────────────────────────────────
export const ExamStatus = z.enum([
  "DRAFT",
  "PUBLISHED",
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
]);
export type ExamStatus = z.infer<typeof ExamStatus>;

export const ExamMode = z.enum(["PUBLIC", "CORPORATE"]);
export type ExamMode = z.infer<typeof ExamMode>;

export const ScheduleStatus = z.enum([
  "SCHEDULED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);
export type ScheduleStatus = z.infer<typeof ScheduleStatus>;

export const AccessType = z.enum(["PUBLIC", "PRIVATE", "CODE"]);
export type AccessType = z.infer<typeof AccessType>;

// ── Exam Schemas ───────────────────────────────────
export const createExamSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).nullable().optional(),
  mode: ExamMode.default("PUBLIC"),
  passingScore: z.number().min(0).max(100).default(50),
  duration: z.number().int().min(1).max(1440).default(60), // 1 min to 24 hours
  settings: z.record(z.string(), z.unknown()).nullable().optional(),
});
export type CreateExamInput = z.infer<typeof createExamSchema>;

export const updateExamSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: ExamStatus.optional(),
  mode: ExamMode.optional(),
  totalPoints: z.number().min(0).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  duration: z.number().int().min(1).max(1440).optional(),
  settings: z.record(z.string(), z.unknown()).nullable().optional(),
});
export type UpdateExamInput = z.infer<typeof updateExamSchema>;

export const examFilterSchema = z.object({
  search: z.string().optional(),
  status: ExamStatus.optional(),
  mode: ExamMode.optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});
export type ExamFilterInput = z.infer<typeof examFilterSchema>;

// ── Section Schemas ────────────────────────────────
export const createSectionSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateSectionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// ── Section Question Schemas ───────────────────────
export const addSectionQuestionSchema = z.object({
  questionId: z.string().uuid(),
  sortOrder: z.number().int().min(0).default(0),
  points: z.number().min(0).nullable().optional(),
});

export const addSectionQuestionsSchema = z.object({
  questionIds: z.array(z.string().uuid()).min(1, "ต้องเลือกอย่างน้อย 1 ข้อ"),
  pointsOverride: z.number().min(0).nullable().optional(),
});
export type AddSectionQuestionsInput = z.infer<typeof addSectionQuestionsSchema>;

export const reorderSectionsSchema = z.object({
  sectionIds: z.array(z.string().uuid()).min(1),
});
export type ReorderSectionsInput = z.infer<typeof reorderSectionsSchema>;

export const reorderSectionQuestionsSchema = z.object({
  questionLinkIds: z.array(z.string().uuid()).min(1),
});
export type ReorderSectionQuestionsInput = z.infer<typeof reorderSectionQuestionsSchema>;

// ── Blueprint Schemas ──────────────────────────────
export const BlueprintMode = z.enum(["BLUEPRINT", "SIMPLE_RANDOM"]);
export type BlueprintMode = z.infer<typeof BlueprintMode>;

export const createBlueprintSchema = z.object({
  sectionId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  subjectId: z.string().uuid().optional().nullable(),
  questionGroupId: z.string().uuid().optional().nullable(),
  mode: BlueprintMode.default("BLUEPRINT"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional().nullable(),
  count: z.number().int().min(1).default(1),
  points: z.number().min(0).default(1),
});
export type CreateBlueprintInput = z.infer<typeof createBlueprintSchema>;

export const generateFromBlueprintSchema = z.object({
  sectionId: z.string().uuid(),
  rules: z.array(
    z.object({
      subjectId: z.string().uuid().optional().nullable(),
      questionGroupId: z.string().uuid().optional().nullable(),
      difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional().nullable(),
      count: z.number().int().min(1),
      points: z.number().min(0).default(1),
    })
  ).min(1, "ต้องมีอย่างน้อย 1 เงื่อนไข"),
});
export type GenerateFromBlueprintInput = z.infer<typeof generateFromBlueprintSchema>;

export const simpleRandomSchema = z.object({
  sectionId: z.string().uuid(),
  subjectId: z.string().uuid().optional().nullable(),
  questionGroupId: z.string().uuid().optional().nullable(),
  count: z.number().int().min(1),
  points: z.number().min(0).default(1),
});
export type SimpleRandomInput = z.infer<typeof simpleRandomSchema>;

// ── Schedule Schemas ───────────────────────────────
export const createScheduleSchema = z.object({
  examId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  registrationOpenDate: z.coerce.date().nullable().optional(),
  registrationDeadline: z.coerce.date().nullable().optional(),
  maxCandidates: z.number().int().min(1).nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  testCenterId: z.string().uuid().nullable().optional(),
  roomId: z.string().uuid().nullable().optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: "วันสิ้นสุดต้องอยู่หลังวันเริ่มต้น",
  path: ["endDate"],
});
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

export const updateScheduleSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  registrationOpenDate: z.coerce.date().nullable().optional(),
  registrationDeadline: z.coerce.date().nullable().optional(),
  maxCandidates: z.number().int().min(1).nullable().optional(),
  status: ScheduleStatus.optional(),
  location: z.string().max(500).nullable().optional(),
  testCenterId: z.string().uuid().nullable().optional(),
  roomId: z.string().uuid().nullable().optional(),
});
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;

export const scheduleFilterSchema = z.object({
  examId: z.string().uuid().optional(),
  status: ScheduleStatus.optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});
export type ScheduleFilterInput = z.infer<typeof scheduleFilterSchema>;

// ── Access Schemas ─────────────────────────────────
export const createAccessSchema = z.object({
  type: AccessType,
  accessCode: z.string().max(50).nullable().optional(),
  allowedEmails: z.array(z.string().email()).nullable().optional(),
});
