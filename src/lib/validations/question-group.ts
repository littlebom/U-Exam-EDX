import { z } from "zod";

// ============================================================
// Create QuestionGroup (กลุ่มข้อสอบ)
// ============================================================
export const createQuestionGroupSchema = z.object({
  subjectId: z.string().uuid("กรุณาระบุวิชา"),
  name: z
    .string()
    .min(1, "กรุณาระบุชื่อกลุ่มข้อสอบ")
    .max(255, "ชื่อกลุ่มต้องไม่เกิน 255 ตัวอักษร"),
  description: z.string().max(500).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

export type CreateQuestionGroupInput = z.infer<
  typeof createQuestionGroupSchema
>;

// ============================================================
// Update QuestionGroup
// ============================================================
export const updateQuestionGroupSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .min(1, "กรุณาระบุชื่อกลุ่มข้อสอบ")
    .max(255)
    .optional(),
  description: z.string().max(500).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export type UpdateQuestionGroupInput = z.infer<
  typeof updateQuestionGroupSchema
>;
