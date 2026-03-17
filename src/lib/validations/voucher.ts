import { z } from "zod";

// ─── Voucher Schemas ────────────────────────────────────────────────

export const VoucherStatus = z.enum(["VALID", "USED", "EXPIRED", "CANCELLED"]);

export const createVoucherSchema = z.object({
  registrationId: z.string().uuid("การสมัครสอบจำเป็น"),
});

export const updateVoucherSchema = z.object({
  status: VoucherStatus.optional(),
});

export const voucherFilterSchema = z.object({
  status: VoucherStatus.optional(),
  examScheduleId: z.string().uuid().optional(),
  candidateId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
});

export const validateVoucherSchema = z.object({
  code: z.string().min(1, "รหัสบัตรเข้าสอบจำเป็น"),
});

// ─── Waiting List Schemas ───────────────────────────────────────────

export const waitingListFilterSchema = z.object({
  examScheduleId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
});

export const promoteWaitingListSchema = z.object({
  registrationId: z.string().uuid("การสมัครสอบจำเป็น"),
});

// ─── Types ──────────────────────────────────────────────────────────

export type CreateVoucher = z.infer<typeof createVoucherSchema>;
export type UpdateVoucher = z.infer<typeof updateVoucherSchema>;
export type VoucherFilter = z.infer<typeof voucherFilterSchema>;
export type ValidateVoucher = z.infer<typeof validateVoucherSchema>;
export type WaitingListFilter = z.infer<typeof waitingListFilterSchema>;
export type PromoteWaitingList = z.infer<typeof promoteWaitingListSchema>;
