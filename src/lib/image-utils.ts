import sharp from "sharp";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import { AppError } from "@/lib/errors";

const MAX_BASE64_SIZE = 5 * 1024 * 1024 * 1.37; // ~5MB in base64

interface ProcessImageOptions {
  /** Subdirectory under public/uploads/ */
  dir: string;
  /** Resize width & height */
  size: number;
  /** Filename prefix (e.g., "avatar", "face") */
  prefix: string;
  /** User ID for filename */
  userId: string;
}

/**
 * Process base64 image: validate, resize, convert to WebP, save to disk
 * Returns the public URL path (e.g., "/uploads/avatars/avatar-xxx.webp")
 */
export async function processAndSaveImage(
  base64Image: string,
  options: ProcessImageOptions
): Promise<string> {
  if (!base64Image || typeof base64Image !== "string") {
    throw new AppError("VALIDATION_ERROR", "กรุณาเลือกรูปภาพ", 400);
  }

  if (base64Image.length > MAX_BASE64_SIZE) {
    throw new AppError("VALIDATION_ERROR", "รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)", 400);
  }

  // Extract base64 data
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, "base64");

  // Process with sharp: resize + WebP
  const processed = await sharp(imageBuffer)
    .resize(options.size, options.size, { fit: "cover", position: "centre" })
    .webp({ quality: 85 })
    .toBuffer();

  // Save file
  const uploadDir = path.join(process.cwd(), "public", "uploads", options.dir);
  await mkdir(uploadDir, { recursive: true });

  const filename = `${options.prefix}-${options.userId}-${randomUUID().slice(0, 8)}.webp`;
  await writeFile(path.join(uploadDir, filename), processed);

  return `/uploads/${options.dir}/${filename}`;
}
