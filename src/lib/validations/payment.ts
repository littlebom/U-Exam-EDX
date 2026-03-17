import { z } from "zod";

// ─── Payment Schemas ────────────────────────────────────────────────

export const createPaymentSchema = z.object({
  registrationId: z.string().uuid("กรุณาระบุการสมัครสอบ"),
  amount: z.number().positive("จำนวนเงินต้องมากกว่า 0"),
  method: z.enum(["CREDIT_CARD", "BANK_TRANSFER", "PROMPTPAY", "E_WALLET"]),
  description: z.string().optional(),
});

export const paymentFilterSchema = z.object({
  status: z.string().optional(),
  method: z.string().optional(),
  candidateId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(50),
});

export const processPaymentSchema = z.object({
  transactionId: z.string().min(1, "กรุณาระบุเลขที่ธุรกรรม"),
  gatewayRef: z.string().optional(),
});

// ─── Invoice Schemas ────────────────────────────────────────────────

export const invoiceFilterSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(50),
});

// ─── Refund Schemas ─────────────────────────────────────────────────

export const createRefundSchema = z.object({
  paymentId: z.string().uuid("กรุณาระบุรายการชำระเงิน"),
  amount: z.number().positive("จำนวนเงินคืนต้องมากกว่า 0"),
  reason: z.string().min(1, "กรุณาระบุเหตุผลในการคืนเงิน"),
});

export const processRefundSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

// ─── Coupon Schemas ─────────────────────────────────────────────────

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, "รหัสคูปองต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, "รหัสคูปองต้องเป็นตัวพิมพ์ใหญ่ ตัวเลข หรือ - _ เท่านั้น"),
  description: z.string().optional(),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive("ค่าส่วนลดต้องมากกว่า 0"),
  maxUses: z.number().int().min(0).default(0),
  minAmount: z.number().min(0).optional(),
  maxDiscount: z.number().positive().optional(),
  validFrom: z.coerce.date(),
  validTo: z.coerce.date(),
});

export const updateCouponSchema = createCouponSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const couponFilterSchema = z.object({
  status: z.string().optional(), // ACTIVE, EXPIRED, DISABLED
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(50),
});

export const applyCouponSchema = z.object({
  code: z.string().min(1, "กรุณาระบุรหัสคูปอง"),
  registrationId: z.string().uuid("กรุณาระบุการสมัครสอบ"),
});

// ─── Type exports ───────────────────────────────────────────────────

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type PaymentFilter = z.infer<typeof paymentFilterSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type CreateRefundInput = z.infer<typeof createRefundSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type CouponFilter = z.infer<typeof couponFilterSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
