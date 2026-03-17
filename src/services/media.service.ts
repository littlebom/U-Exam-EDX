import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { storage, getKeyFromUrl } from "@/lib/storage";
import { parseVideoUrl } from "@/lib/media-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateMediaFileData {
  url: string;
  thumbnailUrl?: string | null;
  type: "IMAGE" | "AUDIO" | "VIDEO";
  filename: string;
  fileSize: number;
  mimeType: string;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  provider?: string | null;
  externalId?: string | null;
}

// ---------------------------------------------------------------------------
// 1. createMediaFile — Create a MediaFile record (after upload)
// ---------------------------------------------------------------------------

export async function createMediaFile(
  tenantId: string,
  uploadedById: string,
  data: CreateMediaFileData
) {
  const mediaFile = await prisma.mediaFile.create({
    data: {
      tenantId,
      uploadedById,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl ?? null,
      type: data.type,
      filename: data.filename,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      width: data.width ?? null,
      height: data.height ?? null,
      duration: data.duration ?? null,
      provider: data.provider ?? null,
      externalId: data.externalId ?? null,
    },
  });

  return mediaFile;
}

// ---------------------------------------------------------------------------
// 2. createVideoMediaFile — Create a MediaFile for YouTube/Vimeo embed
// ---------------------------------------------------------------------------

export async function createVideoMediaFile(
  tenantId: string,
  uploadedById: string,
  videoUrl: string
) {
  const parsed = parseVideoUrl(videoUrl);
  if (!parsed) {
    throw errors.validation("URL วิดีโอไม่ถูกต้อง กรุณาใช้ YouTube หรือ Vimeo");
  }

  const mediaFile = await prisma.mediaFile.create({
    data: {
      tenantId,
      uploadedById,
      url: videoUrl,
      thumbnailUrl: parsed.thumbnailUrl || null,
      type: "VIDEO",
      filename: `${parsed.provider}-${parsed.videoId}`,
      fileSize: 0,
      mimeType: "video/embed",
      provider: parsed.provider,
      externalId: parsed.videoId,
    },
  });

  return mediaFile;
}

// ---------------------------------------------------------------------------
// 3. getMediaFile — Get a single media file
// ---------------------------------------------------------------------------

export async function getMediaFile(tenantId: string, id: string) {
  const mediaFile = await prisma.mediaFile.findFirst({
    where: { id, tenantId },
  });

  if (!mediaFile) {
    throw errors.notFound("ไม่พบไฟล์สื่อ");
  }

  return mediaFile;
}

// ---------------------------------------------------------------------------
// 4. deleteMediaFile — Delete media file + storage cleanup
// ---------------------------------------------------------------------------

export async function deleteMediaFile(tenantId: string, id: string) {
  const mediaFile = await prisma.mediaFile.findFirst({
    where: { id, tenantId },
  });

  if (!mediaFile) {
    throw errors.notFound("ไม่พบไฟล์สื่อ");
  }

  // Delete from storage (only for uploaded files, not video embeds)
  if (mediaFile.type !== "VIDEO") {
    const key = getKeyFromUrl(mediaFile.url);
    if (key) {
      await storage.delete(key);
    }

    // Delete thumbnail if exists
    if (mediaFile.thumbnailUrl) {
      const thumbKey = getKeyFromUrl(mediaFile.thumbnailUrl);
      if (thumbKey) {
        await storage.delete(thumbKey);
      }
    }
  }

  // Delete DB record (cascade deletes QuestionMedia junctions)
  await prisma.mediaFile.delete({
    where: { id },
  });
}
