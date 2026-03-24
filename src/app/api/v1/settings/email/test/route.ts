import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { handleApiError, errors } from "@/lib/errors";
import { decryptSecret } from "@/lib/crypto";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("tenant:settings");
    const body = await req.json();
    const email = body.email as string | undefined;

    if (!email || !email.includes("@")) {
      throw errors.validation("กรุณาระบุอีเมลที่ถูกต้อง");
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { settings: true, name: true },
    });

    const settings = (tenant?.settings ?? {}) as Record<string, unknown>;
    const smtp = (settings.smtp ?? {}) as Record<string, unknown>;

    if (!smtp.host || !smtp.user || !smtp.password) {
      throw errors.validation("กรุณาตั้งค่า SMTP ให้ครบก่อนทดสอบ");
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host as string,
      port: (smtp.port as number) ?? 587,
      secure: false,
      auth: {
        user: smtp.user as string,
        pass: decryptSecret(smtp.password as string),
      },
    });

    await transporter.sendMail({
      from: (smtp.from as string) || `${tenant?.name} <${smtp.user}>`,
      to: email,
      subject: "[U-Exam] ทดสอบการส่งอีเมล",
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
          <h2 style="color:#741717;">U-Exam — ทดสอบ Email</h2>
          <p>อีเมลนี้ส่งจากระบบ U-Exam เพื่อทดสอบการตั้งค่า SMTP</p>
          <p style="color:#888;font-size:12px;">หากคุณได้รับอีเมลนี้ แสดงว่าตั้งค่าถูกต้อง ✓</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      data: { message: `ส่งอีเมลทดสอบไปที่ ${email} สำเร็จ` },
    });
  } catch (error) {
    // Show SMTP error details for debugging
    if (error instanceof Error && !(error as { statusCode?: number }).statusCode) {
      return NextResponse.json(
        {
          success: false,
          error: { message: `SMTP Error: ${error.message}` },
        },
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}
