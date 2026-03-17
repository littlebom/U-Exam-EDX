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
      primaryColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/, "รูปแบบสีไม่ถูกต้อง (เช่น #741717)")
        .optional(),
    })
    .optional(),
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
