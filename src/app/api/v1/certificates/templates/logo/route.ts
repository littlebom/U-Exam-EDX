import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { requirePermission } from "@/lib/rbac";
import { handleApiError, errors } from "@/lib/errors";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: NextRequest) {
  try {
    await requirePermission("certificate:template");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) throw errors.validation("กรุณาเลือกไฟล์รูปภาพ");
    if (!ALLOWED_TYPES.includes(file.type))
      throw errors.validation("รองรับเฉพาะ PNG, JPG, WEBP");
    if (file.size > MAX_SIZE)
      throw errors.validation("ขนาดไฟล์ต้องไม่เกิน 2MB");

    const ext =
      file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const hash = crypto.randomBytes(4).toString("hex");
    const filename = `cert-logo-${hash}-${Date.now()}.${ext}`;

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "cert-logos"
    );
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const logoUrl = `/uploads/cert-logos/${filename}`;

    return NextResponse.json({ success: true, data: { logoUrl } });
  } catch (error) {
    return handleApiError(error);
  }
}
