import { z } from "zod";

// ============================================================
// Create Category
// ============================================================
export const createCategorySchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อหมวดหมู่").max(255),
  description: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// ============================================================
// Update Category
// ============================================================
export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ============================================================
// Create Tag
// ============================================================
export const createTagSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อแท็ก").max(100),
  color: z.string().max(20).optional().nullable(),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;

// ============================================================
// Update Tag
// ============================================================
export const updateTagSchema = createTagSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateTagInput = z.infer<typeof updateTagSchema>;
