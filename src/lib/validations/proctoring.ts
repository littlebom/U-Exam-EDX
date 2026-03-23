import { z } from "zod";

// ── Proctoring Mode ────────────────────────────────
export const ProctoringMode = z.enum(["SCREENSHOT", "LIVE_VIDEO"]);
export type ProctoringMode = z.infer<typeof ProctoringMode>;

// ── Screenshot Mode ────────────────────────────────
export const ScreenshotMode = z.enum(["periodic", "on_event", "both"]);
export type ScreenshotMode = z.infer<typeof ScreenshotMode>;

// ── Proctoring Settings (stored in Exam.settings.proctoring) ──
export const proctoringSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  requireWebcam: z.boolean().default(false),
  requireFaceVerification: z.boolean().default(false),
  faceDetectionEnabled: z.boolean().default(false),
  screenshotInterval: z.number().int().min(10).max(120).default(30), // seconds
  screenshotMode: ScreenshotMode.default("both"), // periodic | on_event | both
  mode: ProctoringMode.default("SCREENSHOT"),
  maxViolations: z.number().int().min(1).max(10).default(3),
});
export type ProctoringSettings = z.infer<typeof proctoringSettingsSchema>;

export const DEFAULT_PROCTORING_SETTINGS: ProctoringSettings = {
  enabled: false,
  requireWebcam: false,
  requireFaceVerification: false,
  faceDetectionEnabled: false,
  screenshotInterval: 30,
  screenshotMode: "both",
  mode: "SCREENSHOT",
  maxViolations: 3,
};

// ── Proctoring Event Types ─────────────────────────
export const PROCTORING_EVENT_TYPES = [
  "TAB_SWITCH",
  "FULLSCREEN_EXIT",
  "COPY_PASTE",
  "FACE_NOT_DETECTED",
  "MULTIPLE_FACES",
  "FACE_TURNED_AWAY",
  "SCREENSHOT_WEBCAM",
  "SCREENSHOT_SCREEN",
  "PROCTOR_MESSAGE",
  "NOISE_DETECTED",
  "SCREEN_SWITCH",
] as const;

export const ProctoringEventType = z.enum(PROCTORING_EVENT_TYPES);
export type ProctoringEventType = z.infer<typeof ProctoringEventType>;

// ── Severity Levels ────────────────────────────────
export const Severity = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type Severity = z.infer<typeof Severity>;

// ── Log Proctoring Event Schema ────────────────────
export const logProctoringEventSchema = z.object({
  type: z.string().min(1).max(50),
  severity: Severity.default("LOW"),
  screenshot: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type LogProctoringEventInput = z.infer<typeof logProctoringEventSchema>;

// ── Proctoring Session Status ──────────────────────
export const ProctoringSessionStatus = z.enum([
  "MONITORING",
  "FLAGGED",
  "REVIEWED",
]);
export type ProctoringSessionStatus = z.infer<typeof ProctoringSessionStatus>;

// ── Incident Types ─────────────────────────────────
export const INCIDENT_TYPES = [
  "SUSPICIOUS_BEHAVIOR",
  "TECHNICAL_ISSUE",
  "POLICY_VIOLATION",
  "OTHER",
] as const;

export const IncidentType = z.enum(INCIDENT_TYPES);
export type IncidentType = z.infer<typeof IncidentType>;

// ── Incident Actions ───────────────────────────────
export const IncidentAction = z.enum(["WARNING", "PAUSE", "TERMINATE"]);
export type IncidentAction = z.infer<typeof IncidentAction>;

// ── Create Incident Schema ─────────────────────────
export const createIncidentSchema = z.object({
  type: IncidentType,
  description: z.string().min(1).max(2000),
  action: IncidentAction,
});
export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;

// ── Resolve Incident Schema ────────────────────────
export const resolveIncidentSchema = z.object({
  resolution: z.string().min(1).max(2000),
});
export type ResolveIncidentInput = z.infer<typeof resolveIncidentSchema>;

// ── Proctor Message Schema ─────────────────────────
export const proctoringMessageSchema = z.object({
  message: z.string().min(1).max(500),
});
export type ProctoringMessageInput = z.infer<typeof proctoringMessageSchema>;

// ── Screenshot Upload Schema ───────────────────────
export const ScreenshotType = z.enum(["WEBCAM", "SCREEN"]);
export type ScreenshotType = z.infer<typeof ScreenshotType>;

export const screenshotUploadSchema = z.object({
  proctoringSessionId: z.string().uuid(),
  type: ScreenshotType,
});
export type ScreenshotUploadInput = z.infer<typeof screenshotUploadSchema>;

// ── Start Proctoring Session Schema ────────────────
export const startProctoringSchema = z.object({
  webcamEnabled: z.boolean().default(false),
  screenShareEnabled: z.boolean().default(false),
});
export type StartProctoringInput = z.infer<typeof startProctoringSchema>;

// ── UI Labels (Thai) ───────────────────────────────
export const PROCTORING_EVENT_LABELS: Record<string, string> = {
  TAB_SWITCH: "สลับแท็บ",
  FULLSCREEN_EXIT: "ออกจากเต็มจอ",
  COPY_PASTE: "คัดลอก/วาง",
  FACE_NOT_DETECTED: "ไม่พบใบหน้า",
  MULTIPLE_FACES: "พบหลายใบหน้า",
  FACE_TURNED_AWAY: "หันหน้าออก",
  SCREENSHOT_WEBCAM: "ภาพจาก Webcam",
  SCREENSHOT_SCREEN: "ภาพหน้าจอ",
  PROCTOR_MESSAGE: "ข้อความจากผู้คุมสอบ",
  NOISE_DETECTED: "ตรวจพบเสียง",
  SCREEN_SWITCH: "สลับหน้าจอ",
};

export const INCIDENT_TYPE_LABELS: Record<string, string> = {
  SUSPICIOUS_BEHAVIOR: "พฤติกรรมน่าสงสัย",
  TECHNICAL_ISSUE: "ปัญหาทางเทคนิค",
  POLICY_VIOLATION: "ฝ่าฝืนกฎ",
  OTHER: "อื่นๆ",
};

export const INCIDENT_ACTION_LABELS: Record<string, string> = {
  WARNING: "ตักเตือน",
  PAUSE: "พักสอบ",
  TERMINATE: "ยุติการสอบ",
};

export const SEVERITY_LABELS: Record<string, string> = {
  LOW: "ต่ำ",
  MEDIUM: "ปานกลาง",
  HIGH: "สูง",
};
