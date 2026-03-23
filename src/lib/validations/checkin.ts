import { z } from "zod";

// ── Check-in Methods ───────────────────────────────
export const CHECKIN_METHODS = ["FACE", "QR", "MANUAL"] as const;
export const CheckinMethod = z.enum(CHECKIN_METHODS);
export type CheckinMethod = z.infer<typeof CheckinMethod>;

// ── Check-in Settings (stored in ExamSchedule.settings.checkin) ──
export const checkinSettingsSchema = z.object({
  enableCheckin: z.boolean().default(false),
  checkinMethods: z.array(CheckinMethod).default(["QR", "MANUAL"]),
  checkinStartMinutes: z.number().int().min(0).max(120).default(30),
  allowLateCheckin: z.boolean().default(true),
  lateCheckinMinutes: z.number().int().min(0).max(60).default(15),
  faceMatchThreshold: z.number().min(0.3).max(0.8).default(0.6),
  requireFaceVerify: z.boolean().default(false),
  requireIpCheck: z.boolean().default(false),
});
export type CheckinSettings = z.infer<typeof checkinSettingsSchema>;

export const DEFAULT_CHECKIN_SETTINGS: CheckinSettings = {
  enableCheckin: false,
  checkinMethods: ["QR", "MANUAL"],
  checkinStartMinutes: 30,
  allowLateCheckin: true,
  lateCheckinMinutes: 15,
  faceMatchThreshold: 0.6,
  requireFaceVerify: false,
  requireIpCheck: false,
};

// ── Face Check-in Request Schema ───────────────────
export const checkinFaceScanSchema = z.object({
  examScheduleId: z.string().uuid(),
  candidateId: z.string().uuid(),
  confidence: z.number().min(0).max(1),
});
export type CheckinFaceScanInput = z.infer<typeof checkinFaceScanSchema>;

// ── Face Descriptor Schema ─────────────────────────
export const faceDescriptorSchema = z.array(z.number()).length(128);
export type FaceDescriptor = z.infer<typeof faceDescriptorSchema>;

// ── Thai Labels ────────────────────────────────────
export const CHECKIN_METHOD_LABELS: Record<string, string> = {
  FACE: "สแกนใบหน้า",
  QR: "QR Code",
  MANUAL: "กรอกรหัส",
};

export const CHECKIN_METHOD_ICONS: Record<string, string> = {
  FACE: "ScanFace",
  QR: "QrCode",
  MANUAL: "Keyboard",
};
