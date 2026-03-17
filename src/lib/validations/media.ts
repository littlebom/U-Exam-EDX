import { z } from "zod";

// ============================================================
// Allowed MIME types & size limits
// ============================================================

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const AUDIO_MIME_TYPES = [
  "audio/mpeg",     // MP3
  "audio/wav",
  "audio/ogg",
  "audio/mp4",      // M4A
  "audio/x-m4a",
] as const;

/** Maximum file sizes in bytes */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB

/** Maximum media counts per question */
export const MAX_IMAGES_PER_QUESTION = 5;
export const MAX_VIDEOS_PER_QUESTION = 3;
export const MAX_AUDIOS_PER_QUESTION = 3;
export const MAX_MEDIA_PER_QUESTION =
  MAX_IMAGES_PER_QUESTION + MAX_VIDEOS_PER_QUESTION + MAX_AUDIOS_PER_QUESTION; // 11

// ============================================================
// Validation helpers
// ============================================================

export function isAllowedImageType(mimeType: string): boolean {
  return (IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function isAllowedAudioType(mimeType: string): boolean {
  return (AUDIO_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function isAllowedMediaType(mimeType: string): boolean {
  return isAllowedImageType(mimeType) || isAllowedAudioType(mimeType);
}

export function getMediaCategory(
  mimeType: string
): "IMAGE" | "AUDIO" | null {
  if (isAllowedImageType(mimeType)) return "IMAGE";
  if (isAllowedAudioType(mimeType)) return "AUDIO";
  return null;
}

export function getMaxFileSize(category: "IMAGE" | "AUDIO"): number {
  return category === "IMAGE" ? MAX_IMAGE_SIZE : MAX_AUDIO_SIZE;
}

// ============================================================
// Zod schemas
// ============================================================

/** Schema for upload validation (server-side) */
export const uploadFileSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().refine(isAllowedMediaType, {
    message:
      "ไฟล์ประเภทนี้ไม่รองรับ รองรับเฉพาะ JPEG, PNG, WebP, GIF, MP3, WAV, OGG, M4A",
  }),
  size: z.number().max(MAX_AUDIO_SIZE, {
    message: "ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 20MB)",
  }),
});

/** Schema for media attachment when saving a question */
export const mediaAttachmentSchema = z.object({
  mediaFileId: z.string().uuid(),
  caption: z.string().max(255).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

/** Schema for video URL input */
export const videoUrlSchema = z.string().url("กรุณาระบุ URL ที่ถูกต้อง");
