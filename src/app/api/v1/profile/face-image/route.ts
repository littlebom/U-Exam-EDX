import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// GET — get current face image URL
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { imageUrl: true },
    });

    return NextResponse.json({
      success: true,
      data: { imageUrl: user?.imageUrl ?? null },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST — upload face image from webcam (base64)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const body = await request.json();
    const { image } = body;

    if (!image || typeof image !== "string") {
      throw new AppError("VALIDATION_ERROR", "กรุณาถ่ายรูปใบหน้า", 400);
    }

    // Extract base64 data (remove data:image/jpeg;base64, prefix)
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Process with sharp: resize, convert to WebP
    const processed = await sharp(imageBuffer)
      .resize(400, 400, { fit: "cover", position: "centre" })
      .webp({ quality: 85 })
      .toBuffer();

    // Save to public/uploads/faces/
    const filename = `face-${session.user.id}-${randomUUID().slice(0, 8)}.webp`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "faces");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), processed);

    const imageUrl = `/uploads/faces/${filename}`;

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
