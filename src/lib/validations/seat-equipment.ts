import { z } from "zod";

// ─── Enums ──────────────────────────────────────────────────────────

export const SeatStatus = z.enum(["AVAILABLE", "OCCUPIED", "DISABLED", "RESERVED"]);
export const SeatType = z.enum(["REGULAR", "WHEELCHAIR", "SPECIAL"]);
export const EquipmentType = z.enum(["COMPUTER", "PROJECTOR", "WEBCAM", "PRINTER", "NETWORK", "UPS", "MONITOR", "OTHER"]);
export const EquipmentStatus = z.enum(["WORKING", "MAINTENANCE", "BROKEN"]);

// ─── Seat Schemas ───────────────────────────────────────────────────

export const createSeatSchema = z.object({
  roomId: z.string().uuid("ห้องสอบจำเป็น"),
  seatNumber: z.string().min(1, "หมายเลขที่นั่งจำเป็น").max(20),
  row: z.coerce.number().int().min(0),
  column: z.coerce.number().int().min(0),
  status: SeatStatus.default("AVAILABLE"),
  type: SeatType.default("REGULAR"),
});

export const updateSeatSchema = createSeatSchema.omit({ roomId: true }).partial();

export const bulkCreateSeatsSchema = z.object({
  roomId: z.string().uuid("ห้องสอบจำเป็น"),
  rows: z.coerce.number().int().min(1, "จำนวนแถวต้องมากกว่า 0").max(26),
  columns: z.coerce.number().int().min(1, "จำนวนคอลัมน์ต้องมากกว่า 0").max(20),
});

export const seatFilterSchema = z.object({
  roomId: z.string().uuid(),
  status: SeatStatus.optional(),
});

// ─── Equipment Schemas ──────────────────────────────────────────────

export const createEquipmentSchema = z.object({
  testCenterId: z.string().uuid("ศูนย์สอบจำเป็น"),
  roomId: z.string().uuid().optional(),
  name: z.string().min(1, "ชื่ออุปกรณ์จำเป็น").max(255),
  type: EquipmentType,
  serialNumber: z.string().min(1, "หมายเลขซีเรียลจำเป็น").max(100),
  status: EquipmentStatus.default("WORKING"),
  lastChecked: z.coerce.date().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export const updateEquipmentSchema = createEquipmentSchema.omit({ testCenterId: true }).partial();

export const equipmentFilterSchema = z.object({
  testCenterId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  type: EquipmentType.optional(),
  status: EquipmentStatus.optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
});

// ─── Types ──────────────────────────────────────────────────────────

export type CreateSeat = z.infer<typeof createSeatSchema>;
export type UpdateSeat = z.infer<typeof updateSeatSchema>;
export type BulkCreateSeats = z.infer<typeof bulkCreateSeatsSchema>;
export type SeatFilter = z.infer<typeof seatFilterSchema>;

export type CreateEquipment = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipment = z.infer<typeof updateEquipmentSchema>;
export type EquipmentFilter = z.infer<typeof equipmentFilterSchema>;
