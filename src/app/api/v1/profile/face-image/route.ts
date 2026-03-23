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
      select: { faceImageUrl: true },
    });

    return NextResponse.json({
      success: true,
      data: { imageUrl: user?.faceImageUrl ?? null },
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
    const { image, descriptor } = body;

    if (!image || typeof image !== "string") {
      throw new AppError("VALIDATION_ERROR", "กรุณาถ่ายรูปใบหน้า", 400);
    }

    // Validate face descriptor if provided (128-element Float32Array)
    if (descriptor && (!Array.isArray(descriptor) || descriptor.length !== 128)) {
      throw new AppError("VALIDATION_ERROR", "Face descriptor ต้องเป็น array 128 ตัวเลข", 400);
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

    // Update face image (separate from profile avatar)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { faceImageUrl: imageUrl },
    });

    // Save face descriptor to CandidateProfile if provided
    const hasDescriptor = descriptor && Array.isArray(descriptor) && descriptor.length === 128;
    console.log("[face-image] descriptor received:", hasDescriptor, "length:", descriptor?.length);
    if (hasDescriptor) {
      try {
        await prisma.candidateProfile.upsert({
          where: { userId: session.user.id },
          update: { faceDescriptor: descriptor },
          create: {
            userId: session.user.id,
            faceDescriptor: descriptor,
          },
        });
        console.log("[face-image] Descriptor saved to DB successfully");
      } catch (dbErr) {
        console.error("[face-image] Failed to save descriptor:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: { imageUrl, hasDescriptor: !!descriptor },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
