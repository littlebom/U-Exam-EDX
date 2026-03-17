import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "กรุณากรอกอีเมล")
    .email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z
    .string()
    .min(1, "กรุณากรอกรหัสผ่าน")
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "กรุณากรอกชื่อ-นามสกุล")
    .min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  email: z
    .string()
    .min(1, "กรุณากรอกอีเมล")
    .email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z
    .string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
  tenantName: z
    .string()
    .min(2, "ชื่อองค์กรต้องมีอย่างน้อย 2 ตัวอักษร"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
