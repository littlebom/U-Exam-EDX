import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, errors } from "@/lib/errors";
import { z } from "zod";
import { decryptSecret } from "@/lib/crypto";
import nodemailer from "nodemailer";
import { createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 3 });

interface TenantSettings {
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  facebook?: string;
  line?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  businessHours?: string;
  googleMapUrl?: string;
}

export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { isActive: true },
      select: {
        name: true,
        logoUrl: true,
        settings: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (!tenant) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const settings = (tenant.settings ?? {}) as TenantSettings;

    return NextResponse.json({
      success: true,
      data: {
        name: tenant.name,
        logoUrl: tenant.logoUrl,
        email: settings.email ?? null,
        phone: settings.phone ?? null,
        address: settings.address ?? null,
        website: settings.website ?? null,
        facebook: settings.facebook ?? null,
        line: settings.line ?? null,
        instagram: settings.instagram ?? null,
        twitter: settings.twitter ?? null,
        youtube: settings.youtube ?? null,
        tiktok: settings.tiktok ?? null,
        businessHours: settings.businessHours ?? null,
        googleMapUrl: settings.googleMapUrl ?? null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── POST — Send contact message via email ────────────────────────

const contactFormSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อ").max(200),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  subject: z.string().min(1, "กรุณาระบุหัวข้อ").max(500),
  message: z.string().min(1, "กรุณาระบุข้อความ").max(5000),
});

export async function POST(req: NextRequest) {
  const rl = limiter.check(req);
  if (!rl.success) return rl.response!;

  try {
    const body = await req.json();
    const data = contactFormSchema.parse(body);

    // Load tenant + SMTP settings
    const tenant = await prisma.tenant.findFirst({
      where: { isActive: true },
      select: { name: true, settings: true },
      orderBy: { createdAt: "asc" },
    });

    if (!tenant) throw errors.internal("ไม่พบข้อมูลองค์กร");

    const settings = (tenant.settings ?? {}) as Record<string, unknown>;
    const smtp = (settings.smtp ?? {}) as Record<string, unknown>;
    const adminEmail = settings.email as string | undefined;

    if (!smtp.host || !smtp.user || !smtp.password) {
      throw errors.internal("ระบบยังไม่ได้ตั้งค่า SMTP");
    }

    if (!adminEmail) {
      throw errors.internal("ยังไม่ได้ตั้งค่าอีเมลองค์กร");
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

    // Send to admin
    await transporter.sendMail({
      from: (smtp.from as string) || `${tenant.name} <${smtp.user}>`,
      to: adminEmail,
      replyTo: data.email,
      subject: `[ติดต่อเรา] ${data.subject}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#741717;">ข้อความจากหน้าติดต่อเรา</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px;font-weight:bold;width:100px;">ชื่อ:</td><td style="padding:8px;">${data.name}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">อีเมล:</td><td style="padding:8px;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
            <tr><td style="padding:8px;font-weight:bold;">หัวข้อ:</td><td style="padding:8px;">${data.subject}</td></tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#f5f5f5;border-radius:8px;">
            <p style="margin:0;white-space:pre-wrap;">${data.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          </div>
          <p style="margin-top:16px;color:#888;font-size:12px;">ส่งจากระบบ ${tenant.name} — หน้าติดต่อเรา</p>
        </div>
      `,
    });

    // Send confirmation to sender
    await transporter.sendMail({
      from: (smtp.from as string) || `${tenant.name} <${smtp.user}>`,
      to: data.email,
      subject: `[${tenant.name}] ได้รับข้อความของคุณแล้ว`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#741717;">${tenant.name}</h2>
          <p>สวัสดีคุณ ${data.name},</p>
          <p>เราได้รับข้อความของคุณเรียบร้อยแล้ว และจะติดต่อกลับโดยเร็วที่สุด</p>
          <div style="margin-top:16px;padding:16px;background:#f5f5f5;border-radius:8px;">
            <p style="margin:0 0 8px;font-weight:bold;">หัวข้อ: ${data.subject}</p>
            <p style="margin:0;white-space:pre-wrap;">${data.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          </div>
          <p style="margin-top:16px;color:#888;font-size:12px;">อีเมลนี้ส่งอัตโนมัติจากระบบ ${tenant.name} กรุณาอย่าตอบกลับอีเมลนี้</p>
        </div>
      `,
    }).catch(() => {}); // ไม่ block ถ้าส่ง confirmation ไม่สำเร็จ

    return NextResponse.json({
      success: true,
      data: { message: "ส่งข้อความเรียบร้อยแล้ว" },
    });
  } catch (error) {
    if (error instanceof Error && !(error as { statusCode?: number }).statusCode) {
      return NextResponse.json(
        { success: false, error: { message: `ไม่สามารถส่งข้อความได้: ${error.message}` } },
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}
