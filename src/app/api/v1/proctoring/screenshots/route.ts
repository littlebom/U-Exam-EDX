import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/get-session";
import { handleApiError, AppError } from "@/lib/errors";
import { logProctoringEvent } from "@/services/proctoring.service";
import { storage } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * POST /api/v1/proctoring/screenshots
 *
 * Upload a screenshot (webcam or screen) during a proctoring session.
 * Auth: candidate who owns the exam session.
 *
 * FormData: image (Blob), proctoringSessionId (string), type (WEBCAM|SCREEN)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionContext();
    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const proctoringSessionId = formData.get("proctoringSessionId") as string;
    const type = formData.get("type") as string; // WEBCAM | SCREEN

    if (!image || !proctoringSessionId || !type) {
      throw new AppError(
        "VALIDATION_ERROR",
        "ต้องระบุ image, proctoringSessionId, และ type",
        400
      );
    }

    if (!["WEBCAM", "SCREEN"].includes(type)) {
      throw new AppError("VALIDATION_ERROR", "type ต้องเป็น WEBCAM หรือ SCREEN", 400);
    }

    // Verify session ownership
    const proctoringSession = await prisma.proctoringSession.findUnique({
      where: { id: proctoringSessionId },
      include: {
        examSession: {
          select: { candidateId: true, status: true },
        },
      },
    });

    if (!proctoringSession) {
      throw new AppError("NOT_FOUND", "ไม่พบ proctoring session", 404);
    }

    if (proctoringSession.examSession.candidateId !== session.user.id) {
      throw new AppError("FORBIDDEN", "ไม่มีสิทธิ์เข้าถึง session นี้", 403);
    }

    // Read image buffer
    const buffer = Buffer.from(await image.arrayBuffer());

    // Generate key: proctoring/{sessionId}/{timestamp}-{type}.webp
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    const timestamp = Date.now();
    const key = `proctoring/${proctoringSessionId}/${timestamp}-${type.toLowerCase()}-${id}.webp`;

    // Try to compress with sharp if available, otherwise save as-is
    let finalBuffer = buffer;
    let contentType = image.type || "image/webp";
    try {
      const sharp = (await import("sharp")).default;
      finalBuffer = await sharp(buffer)
        .resize(640, 480, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 70 })
        .toBuffer();
      contentType = "image/webp";
    } catch {
      // sharp not available, save original
    }

    // Upload
    const url = await storage.upload(finalBuffer, key, contentType);

    // Log as proctoring event
    const eventType = type === "WEBCAM" ? "SCREENSHOT_WEBCAM" : "SCREENSHOT_SCREEN";
    await logProctoringEvent(proctoringSessionId, {
      type: eventType,
      severity: "LOW",
      screenshot: url,
      metadata: { size: finalBuffer.length, originalType: image.type },
    });

    return NextResponse.json(
      {
        success: true,
        data: { url, type: eventType },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
