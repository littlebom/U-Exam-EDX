import { z } from "zod";

// ─── News Schemas ─────────────────────────────────────────────────

export const NewsStatus = z.enum(["DRAFT", "PUBLISHED"]);

export const createNewsSchema = z.object({
  title: z.string().min(1, "หัวข้อจำเป็น").max(500, "หัวข้อยาวเกินไป"),
  content: z.string().min(1, "เนื้อหาจำเป็น"),
  coverImage: z.string().url("URL รูปปกไม่ถูกต้อง").max(500).optional().or(z.literal("")),
  status: NewsStatus.default("DRAFT"),
});

export const updateNewsSchema = z.object({
  title: z.string().min(1, "หัวข้อจำเป็น").max(500, "หัวข้อยาวเกินไป").optional(),
  content: z.string().min(1, "เนื้อหาจำเป็น").optional(),
  coverImage: z.string().url("URL รูปปกไม่ถูกต้อง").max(500).optional().or(z.literal("")).or(z.null()),
  status: NewsStatus.optional(),
});

export const newsFilterSchema = z.object({
  status: NewsStatus.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateNews = z.infer<typeof createNewsSchema>;
export type UpdateNews = z.infer<typeof updateNewsSchema>;
export type NewsFilter = z.infer<typeof newsFilterSchema>;
