import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");
const MAX_SIZE = 5 * 1024 * 1024; // 5MB base64 ≈ ~3.7MB raw

// POST — upload cropped avatar (base64)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const body = await request.json();
    const { image } = body;

    if (!image || typeof image !== "string") {
      throw new AppError("VALIDATION_ERROR", "กรุณาเลือกรูปภาพ", 400);
    }

    // Validate size (base64 string length)
    if (image.length > MAX_SIZE) {
      throw new AppError("VALIDATION_ERROR", "รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)", 400);
    }

    // Extract base64 data
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Process with sharp: resize 256×256, convert to WebP
    const processed = await sharp(imageBuffer)
      .resize(256, 256, { fit: "cover", position: "centre" })
      .webp({ quality: 85 })
      .toBuffer();

    // Save file
    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `avatar-${session.user.id}-${randomUUID().slice(0, 8)}.webp`;
    await writeFile(path.join(UPLOAD_DIR, filename), processed);

    const imageUrl = `/uploads/avatars/${filename}`;

    // Delete old avatar file if exists
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { imageUrl: true },
    });
    if (currentUser?.imageUrl?.startsWith("/uploads/avatars/")) {
      try {
        await unlink(path.join(process.cwd(), "public", currentUser.imageUrl));
      } catch {
        // Old file may not exist — ignore
      }
    }

    // Update user record
    await prisma.user.update({
      where: { id: session.user.id },
      data: { imageUrl },
    });

    return NextResponse.json({
      success: true,
      data: { imageUrl },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE — remove avatar
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { imageUrl: true },
    });

    // Delete file if it's an avatar
    if (user?.imageUrl?.startsWith("/uploads/avatars/")) {
      try {
        await unlink(path.join(process.cwd(), "public", user.imageUrl));
      } catch {
        // File may not exist — ignore
      }
    }

    // Clear imageUrl
    await prisma.user.update({
      where: { id: session.user.id },
      data: { imageUrl: null },
    });

    return NextResponse.json({
      success: true,
      data: { imageUrl: null },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
