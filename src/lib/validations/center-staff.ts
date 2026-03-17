import { z } from "zod";

// ─── Enums ──────────────────────────────────────────────────────────

export const StaffPosition = z.enum(["PROCTOR", "IT_SUPPORT", "RECEPTION", "ADMIN", "COORDINATOR"]);
export const StaffStatus = z.enum(["ACTIVE", "ON_LEAVE", "INACTIVE"]);
export const ShiftRole = z.enum(["PROCTOR", "SUPPORT", "ADMIN", "COORDINATOR"]);
export const ShiftStatus = z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);

// ─── CenterStaff Schemas ────────────────────────────────────────────

export const createCenterStaffSchema = z.object({
  testCenterId: z.string().uuid("ศูนย์สอบจำเป็น"),
  userId: z.string().uuid("ผู้ใช้จำเป็น"),
  position: StaffPosition,
  status: StaffStatus.default("ACTIVE"),
  phone: z.string().max(20).optional(),
  certifications: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const updateCenterStaffSchema = createCenterStaffSchema
  .omit({ testCenterId: true, userId: true })
  .partial();

export const centerStaffFilterSchema = z.object({
  testCenterId: z.string().uuid().optional(),
  position: StaffPosition.optional(),
  status: StaffStatus.optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
});

// ─── StaffShift Schemas ─────────────────────────────────────────────

export const createStaffShiftSchema = z.object({
  centerStaffId: z.string().uuid("บุคลากรจำเป็น"),
  date: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "รูปแบบเวลา HH:mm"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "รูปแบบเวลา HH:mm"),
  role: ShiftRole,
  examScheduleId: z.string().uuid().optional(),
  status: ShiftStatus.default("SCHEDULED"),
  notes: z.string().optional(),
});

export const updateStaffShiftSchema = createStaffShiftSchema
  .omit({ centerStaffId: true })
  .partial();

export const staffShiftFilterSchema = z.object({
  centerStaffId: z.string().uuid().optional(),
  testCenterId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  status: ShiftStatus.optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
});

// ─── Types ──────────────────────────────────────────────────────────

export type CreateCenterStaff = z.infer<typeof createCenterStaffSchema>;
export type UpdateCenterStaff = z.infer<typeof updateCenterStaffSchema>;
export type CenterStaffFilter = z.infer<typeof centerStaffFilterSchema>;

export type CreateStaffShift = z.infer<typeof createStaffShiftSchema>;
export type UpdateStaffShift = z.infer<typeof updateStaffShiftSchema>;
export type StaffShiftFilter = z.infer<typeof staffShiftFilterSchema>;
