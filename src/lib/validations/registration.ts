import { z } from "zod";

// ─── Enums ──────────────────────────────────────────────────────────

export const RegistrationStatus = z.enum(["PENDING", "CONFIRMED", "CANCELLED", "WAITING_LIST"]);
export const PaymentStatus = z.enum(["PENDING", "PAID", "REFUNDED", "WAIVED"]);

// ─── Registration Schemas ───────────────────────────────────────────

export const createRegistrationSchema = z.object({
  candidateId: z.string().uuid("ผู้สมัครจำเป็น"),
  examScheduleId: z.string().uuid("รอบสอบจำเป็น"),
  testCenterId: z.string().uuid().optional(),
  amount: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export const updateRegistrationSchema = z.object({
  status: RegistrationStatus.optional(),
  paymentStatus: PaymentStatus.optional(),
  testCenterId: z.string().uuid().optional(),
  seatId: z.string().uuid().optional(),
  seatNumber: z.string().max(20).optional(),
  amount: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const registrationFilterSchema = z.object({
  status: RegistrationStatus.optional(),
  paymentStatus: PaymentStatus.optional(),
  examScheduleId: z.string().uuid().optional(),
  candidateId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
});

// ─── Catalog Schemas (public exam listing) ──────────────────────────

export const catalogFilterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Candidate Self-Register Schema ──────────────────────────────────

export const candidateSelfRegisterSchema = z.object({
  testCenterId: z.string().uuid().optional(),
  seatId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export type CandidateSelfRegister = z.infer<typeof candidateSelfRegisterSchema>;

// ─── Types ──────────────────────────────────────────────────────────

export type CreateRegistration = z.infer<typeof createRegistrationSchema>;
export type UpdateRegistration = z.infer<typeof updateRegistrationSchema>;
export type RegistrationFilter = z.infer<typeof registrationFilterSchema>;
export type CatalogFilter = z.infer<typeof catalogFilterSchema>;
