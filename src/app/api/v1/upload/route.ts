import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { requirePermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/errors";
import { storage, generateFileKey, getThumbnailKey } from "@/lib/storage";
import { createMediaFile } from "@/services/media.service";
import {
  getMediaCategory,
  getMaxFileSize,
  isAllowedMediaType,
} from "@/lib/validations/media";

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("question:create");

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกไฟล์" },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!isAllowedMediaType(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไฟล์ประเภทนี้ไม่รองรับ รองรับเฉพาะ JPEG, PNG, WebP, GIF, MP3, WAV, OGG, M4A",
        },
        { status: 400 }
      );
    }

    const category = getMediaCategory(file.type);
    if (!category) {
      return NextResponse.json(
        { success: false, error: "ไม่สามารถระบุประเภทไฟล์ได้" },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = getMaxFileSize(category);
    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / 1024 / 1024);
      return NextResponse.json(
        {
          success: false,
          error: `ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${maxMB}MB)`,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (category === "IMAGE") {
      // ── Image Pipeline: trim → resize → webp + thumbnail ──
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Step 1: Auto crop (trim white/transparent borders)
      // Step 2: Resize to max 1200px
      // Step 3: Convert to WebP
      const processed = await sharp(buffer)
        .trim()
        .resize({
          width: 1200,
          height: 1200,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer({ resolveWithObject: true });

      // Generate thumbnail (300×300 cover crop)
      const thumbnail = await sharp(processed.data)
        .resize(300, 300, { fit: "cover" })
        .webp({ quality: 75 })
        .toBuffer();

      // Generate file keys
      const imageKey = generateFileKey(session.tenantId, "img", "webp");
      const thumbKey = getThumbnailKey(imageKey);

      // Upload both
      const imageUrl = await storage.upload(
        processed.data,
        imageKey,
        "image/webp"
      );
      const thumbnailUrl = await storage.upload(
        thumbnail,
        thumbKey,
        "image/webp"
      );

      // Create DB record
      const mediaFile = await createMediaFile(
        session.tenantId,
        session.userId,
        {
          url: imageUrl,
          thumbnailUrl,
          type: "IMAGE",
          filename: file.name,
          fileSize: processed.data.length,
          mimeType: "image/webp",
          width: processed.info.width,
          height: processed.info.height,
        }
      );

      return NextResponse.json({ success: true, data: mediaFile });
    } else {
      // ── Audio Pipeline: validate + save as-is ──
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp3";
      const audioKey = generateFileKey(session.tenantId, "aud", ext);

      const audioUrl = await storage.upload(buffer, audioKey, file.type);

      // Create DB record
      const mediaFile = await createMediaFile(
        session.tenantId,
        session.userId,
        {
          url: audioUrl,
          type: "AUDIO",
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type,
        }
      );

      return NextResponse.json({ success: true, data: mediaFile });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
