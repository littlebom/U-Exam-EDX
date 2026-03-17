import { z } from "zod";

// ============================================================
// Create Subject (วิชา)
// ============================================================
export const createSubjectSchema = z.object({
  code: z.string().min(1, "กรุณาระบุรหัสวิชา").max(50),
  name: z.string().min(1, "กรุณาระบุชื่อวิชา").max(255),
  description: z.string().max(500).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

// ============================================================
// Update Subject
// ============================================================
export const updateSubjectSchema = createSubjectSchema.partial().extend({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
});

export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
