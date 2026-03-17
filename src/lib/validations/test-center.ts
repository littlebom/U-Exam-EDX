import { z } from "zod";

// ─── Enums ──────────────────────────────────────────────────────────

export const CenterStatus = z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]);
export const RoomStatus = z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "INACTIVE"]);
export const BuildingStatus = z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]);

// ─── TestCenter Schemas ─────────────────────────────────────────────

export const createTestCenterSchema = z.object({
  name: z.string().min(1, "ชื่อศูนย์สอบจำเป็น").max(255),
  code: z.string().max(50).optional(),
  address: z.string().min(1, "ที่อยู่จำเป็น").max(500),
  district: z.string().min(1, "เขต/อำเภอจำเป็น").max(100),
  province: z.string().min(1, "จังหวัดจำเป็น").max(100),
  postalCode: z.string().min(5, "รหัสไปรษณีย์ไม่ถูกต้อง").max(10),
  phone: z.string().max(20).optional(),
  email: z.string().email("อีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  facilities: z.array(z.string()).optional(),
  operatingHours: z.string().max(255).optional(),
  status: CenterStatus.default("ACTIVE"),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  managerId: z.string().uuid().optional(),
});

export const updateTestCenterSchema = createTestCenterSchema.partial();

export const testCenterFilterSchema = z.object({
  status: CenterStatus.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Building Schemas ───────────────────────────────────────────────

export const createBuildingSchema = z.object({
  testCenterId: z.string().uuid("ศูนย์สอบจำเป็น"),
  name: z.string().min(1, "ชื่ออาคารจำเป็น").max(255),
  code: z.string().max(50).optional(),
  floors: z.coerce.number().int().min(1).default(1),
  address: z.string().max(500).optional(),
  description: z.string().optional(),
  status: BuildingStatus.default("ACTIVE"),
});

export const updateBuildingSchema = createBuildingSchema.omit({ testCenterId: true }).partial();

export const buildingFilterSchema = z.object({
  testCenterId: z.string().uuid().optional(),
  status: BuildingStatus.optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
});

// ─── Room Schemas ───────────────────────────────────────────────────

export const createRoomSchema = z.object({
  testCenterId: z.string().uuid("ศูนย์สอบจำเป็น"),
  buildingId: z.string().uuid().optional(),
  name: z.string().min(1, "ชื่อห้องจำเป็น").max(255),
  code: z.string().max(50).optional(),
  floor: z.coerce.number().int().min(0).default(1),
  capacity: z.coerce.number().int().min(0).default(0),
  status: RoomStatus.default("AVAILABLE"),
  hasProjector: z.boolean().default(false),
  hasAC: z.boolean().default(true),
  hasWebcam: z.boolean().default(false),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export const updateRoomSchema = createRoomSchema.omit({ testCenterId: true }).partial();

export const roomFilterSchema = z.object({
  testCenterId: z.string().uuid().optional(),
  buildingId: z.string().uuid().optional(),
  status: RoomStatus.optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
});

// ─── Types ──────────────────────────────────────────────────────────

export type CreateTestCenter = z.infer<typeof createTestCenterSchema>;
export type UpdateTestCenter = z.infer<typeof updateTestCenterSchema>;
export type TestCenterFilter = z.infer<typeof testCenterFilterSchema>;

export type CreateBuilding = z.infer<typeof createBuildingSchema>;
export type UpdateBuilding = z.infer<typeof updateBuildingSchema>;
export type BuildingFilter = z.infer<typeof buildingFilterSchema>;

export type CreateRoom = z.infer<typeof createRoomSchema>;
export type UpdateRoom = z.infer<typeof updateRoomSchema>;
export type RoomFilter = z.infer<typeof roomFilterSchema>;
