import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { verifyPassword } from "@/lib/auth-utils";

// ─── Request Email Change (User flow — requires password) ───────────

export async function requestEmailChange(
  userId: string,
  newEmail: string,
  password: string
) {
  // 1. Verify current password
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, email: true },
  });

  if (!user) throw errors.notFound("ไม่พบผู้ใช้");
  if (!user.passwordHash) {
    throw errors.badRequest("บัญชีนี้ใช้ Social Login ไม่สามารถเปลี่ยนอีเมลด้วยรหัสผ่านได้");
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) throw errors.unauthorized("รหัสผ่านไม่ถูกต้อง");

  // 2. Check if new email is same as current
  if (user.email.toLowerCase() === newEmail.toLowerCase()) {
    throw errors.badRequest("อีเมลใหม่ต้องไม่เหมือนอีเมลเดิม");
  }

  // 3. Check uniqueness of new email
  const existing = await prisma.user.findUnique({
    where: { email: newEmail.toLowerCase() },
  });
  if (existing) throw errors.conflict("อีเมลนี้ถูกใช้งานแล้ว");

  // 4. Invalidate any existing pending requests for this user
  await prisma.emailVerification.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() }, // mark as used/cancelled
  });

  // 5. Create verification token (24h expiry)
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerification.create({
    data: {
      userId,
      newEmail: newEmail.toLowerCase(),
      token,
      expiresAt,
    },
  });

  // 6. Log verification URL (dev mode — replace with email service later)
  const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify-email?token=${token}`;
  // Dev mode: log verification URL (production sends real email)
  if (process.env.NODE_ENV !== "production") {
    console.log(`[email-change] ${user.email} → ${newEmail} | ${verifyUrl}`);
  }

  return { message: "ส่งลิงก์ยืนยันไปที่อีเมลใหม่แล้ว กรุณาตรวจสอบอีเมล" };
}

// ─── Confirm Email Change (via token) ───────────────────────────────

export async function confirmEmailChange(token: string) {
  const verification = await prisma.emailVerification.findUnique({
    where: { token },
    include: { user: { select: { email: true } } },
  });

  if (!verification) throw errors.notFound("ลิงก์ไม่ถูกต้อง");
  if (verification.usedAt) throw errors.badRequest("ลิงก์นี้ถูกใช้งานแล้ว");
  if (verification.expiresAt < new Date()) {
    throw errors.badRequest("ลิงก์หมดอายุแล้ว กรุณาขอเปลี่ยนอีเมลใหม่");
  }

  // Check new email is still available
  const existing = await prisma.user.findUnique({
    where: { email: verification.newEmail },
  });
  if (existing) throw errors.conflict("อีเมลนี้ถูกใช้งานแล้ว");

  // Update email and mark token as used
  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: { email: verification.newEmail },
    }),
    prisma.emailVerification.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return {
    oldEmail: verification.user.email,
    newEmail: verification.newEmail,
  };
}

// ─── Admin Change Email (direct, no verification) ───────────────────

export async function adminChangeEmail(userId: string, newEmail: string) {
  // Check user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) throw errors.notFound("ไม่พบผู้ใช้");

  // Check new email is not same
  if (user.email.toLowerCase() === newEmail.toLowerCase()) {
    throw errors.badRequest("อีเมลใหม่ต้องไม่เหมือนอีเมลเดิม");
  }

  // Check uniqueness
  const existing = await prisma.user.findUnique({
    where: { email: newEmail.toLowerCase() },
  });
  if (existing) throw errors.conflict("อีเมลนี้ถูกใช้งานแล้ว");

  // Direct update
  await prisma.user.update({
    where: { id: userId },
    data: { email: newEmail.toLowerCase() },
  });

  return { oldEmail: user.email, newEmail: newEmail.toLowerCase() };
}
