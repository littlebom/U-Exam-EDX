import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { handleApiError, errors } from "@/lib/errors";

type RouteContext = { params: Promise<{ tenantId: string }> };

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("tenant:settings");
    const { tenantId } = await context.params;

    if (tenantId !== session.tenantId) {
      throw errors.forbidden("ไม่สามารถแก้ไขข้อมูลองค์กรอื่นได้");
    }

    const formData = await req.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      throw errors.validation("กรุณาเลือกไฟล์รูปภาพ");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw errors.validation("รองรับเฉพาะไฟล์ PNG, JPG, WEBP เท่านั้น");
    }

    if (file.size > MAX_SIZE) {
      throw errors.validation("ขนาดไฟล์ต้องไม่เกิน 2MB");
    }

    // Generate unique filename
    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const filename = `${tenantId}-${Date.now()}.${ext}`;

    // Save to public/uploads/logos/
    const uploadDir = path.join(process.cwd(), "public", "uploads", "logos");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const logoUrl = `/uploads/logos/${filename}`;

    // Update tenant in DB
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { logoUrl },
    });

    return NextResponse.json({
      success: true,
      data: { logoUrl },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
