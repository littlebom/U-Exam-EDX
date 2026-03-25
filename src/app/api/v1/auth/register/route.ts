import { NextRequest, NextResponse } from "next/server";
import { handleApiError, AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-utils";
import { z } from "zod";
import { createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 3 });

const candidateRegisterSchema = z.object({
  name: z
    .string()
    .min(1, "กรุณากรอกชื่อ-นามสกุล")
    .min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  email: z
    .string()
    .min(1, "กรุณากรอกอีเมล")
    .email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z
    .string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
});

// POST — register a new candidate user (no tenant required)
export async function POST(request: NextRequest) {
  const rl = limiter.check(request);
  if (!rl.success) return rl.response!;

  try {
    const body = await request.json();
    const parsed = candidateRegisterSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "form";
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return NextResponse.json(
        { success: false, fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const emailLower = email.toLowerCase();

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existing) {
      throw new AppError(
        "CONFLICT",
        "อีเมลนี้ถูกใช้งานแล้ว",
        409
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user (candidate — no tenant assignment)
    const user = await prisma.user.create({
      data: {
        email: emailLower,
        name,
        passwordHash,
        provider: "credentials",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { userId: user.id },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
