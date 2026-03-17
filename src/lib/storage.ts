import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// ============================================================
// Storage Adapter Interface
// เปลี่ยน implementation ได้ง่าย (Local → S3 → R2)
// ============================================================

export interface StorageAdapter {
  /** Upload a buffer and return the public URL */
  upload(buffer: Buffer, key: string, contentType: string): Promise<string>;
  /** Delete a file by key */
  delete(key: string): Promise<void>;
  /** Get the public URL for a key */
  getUrl(key: string): string;
}

// ============================================================
// Local Filesystem Storage
// เก็บไฟล์ใน public/uploads/ — Next.js serve static อัตโนมัติ
// ============================================================

class LocalStorage implements StorageAdapter {
  private baseDir: string;
  private urlPrefix: string;

  constructor(baseDir = "public/uploads", urlPrefix = "/uploads") {
    this.baseDir = baseDir;
    this.urlPrefix = urlPrefix;
  }

  async upload(
    buffer: Buffer,
    key: string,
    _contentType: string
  ): Promise<string> {
    const filePath = path.join(this.baseDir, key);
    const dir = path.dirname(filePath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, buffer);

    return this.getUrl(key);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  getUrl(key: string): string {
    return `${this.urlPrefix}/${key}`;
  }
}

// ============================================================
// Singleton export
// ============================================================

const uploadDir = process.env.UPLOAD_DIR || "public/uploads";
export const storage = new LocalStorage(uploadDir);

// ============================================================
// Helpers
// ============================================================

/** Generate a unique file key: {tenantId}/{prefix}-{uuid}.{ext} */
export function generateFileKey(
  tenantId: string,
  prefix: "img" | "aud",
  ext: string
): string {
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `${tenantId}/${prefix}-${id}.${ext}`;
}

/** Generate the thumbnail key from an image key */
export function getThumbnailKey(imageKey: string): string {
  const parsed = path.parse(imageKey);
  return `${parsed.dir}/${parsed.name}-thumb${parsed.ext}`;
}

/** Extract storage key from a URL (reverse of getUrl) */
export function getKeyFromUrl(url: string): string | null {
  const prefix = "/uploads/";
  if (url.startsWith(prefix)) {
    return url.slice(prefix.length);
  }
  return null;
}
