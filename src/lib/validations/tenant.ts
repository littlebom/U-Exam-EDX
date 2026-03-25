import { z } from "zod";

export const updateTenantSchema = z.object({
  name: z
    .string()
    .min(1, "กรุณากรอกชื่อองค์กร")
    .max(255, "ชื่อองค์กรต้องไม่เกิน 255 ตัวอักษร"),
  settings: z
    .object({
      email: z
        .string()
        .email("รูปแบบอีเมลไม่ถูกต้อง")
        .or(z.literal(""))
        .optional(),
      phone: z
        .string()
        .max(20, "เบอร์โทรต้องไม่เกิน 20 ตัวอักษร")
        .optional(),
      address: z
        .string()
        .max(500, "ที่อยู่ต้องไม่เกิน 500 ตัวอักษร")
        .optional(),
      website: z
        .string()
        .url("รูปแบบ URL ไม่ถูกต้อง")
        .or(z.literal(""))
        .optional(),
      facebook: z
        .string()
        .url("รูปแบบ URL ไม่ถูกต้อง")
        .or(z.literal(""))
        .optional(),
      line: z
        .string()
        .max(200, "LINE ID ต้องไม่เกิน 200 ตัวอักษร")
        .optional(),
      instagram: z
        .string()
        .url("รูปแบบ URL ไม่ถูกต้อง")
        .or(z.literal(""))
        .optional(),
      twitter: z
        .string()
        .url("รูปแบบ URL ไม่ถูกต้อง")
        .or(z.literal(""))
        .optional(),
      youtube: z
        .string()
        .url("รูปแบบ URL ไม่ถูกต้อง")
        .or(z.literal(""))
        .optional(),
      tiktok: z
        .string()
        .url("รูปแบบ URL ไม่ถูกต้อง")
        .or(z.literal(""))
        .optional(),
      businessHours: z
        .array(
          z.object({
            day: z.string(),
            open: z.string(),
            close: z.string(),
            closed: z.boolean(),
          })
        )
        .optional(),
      googleMapUrl: z
        .string()
        .url("รูปแบบ URL ไม่ถูกต้อง")
        .or(z.literal(""))
        .optional(),
      primaryColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/, "รูปแบบสีไม่ถูกต้อง (เช่น #741717)")
        .optional(),
      auditLogRetentionDays: z
        .number()
        .int()
        .min(1)
        .max(365)
        .optional(),
    })
    .optional(),
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
