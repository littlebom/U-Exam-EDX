import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
  tenantId?: string;
}

// Get SMTP config: tenant DB → fallback .env
async function getSmtpConfig(tenantId?: string) {
  // Try tenant settings first
  if (tenantId) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { settings: true },
      });
      const settings = (tenant?.settings ?? {}) as Record<string, unknown>;
      const smtp = (settings.smtp ?? {}) as Record<string, unknown>;

      if (smtp.host && smtp.user && smtp.password) {
        return {
          host: smtp.host as string,
          port: (smtp.port as number) ?? 587,
          user: smtp.user as string,
          pass: smtp.password as string,
          from: (smtp.from as string) || `U-Exam <${smtp.user}>`,
        };
      }
    } catch {
      // Fall through to env
    }
  }

  // Fallback to .env
  if (process.env.SMTP_USER) {
    return {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || "",
      from: process.env.SMTP_FROM || `U-Exam <${process.env.SMTP_USER}>`,
    };
  }

  return null;
}

export async function sendEmail(options: EmailOptions) {
  const config = await getSmtpConfig(options.tenantId);

  if (!config) {
    console.warn("[mailer] SMTP not configured — skipping email");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: false,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const maxRetries = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await transporter.sendMail({
        from: config.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      });
      return result;
    } catch (err) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);

      // Don't retry on auth/validation errors — only transient errors
      if (errMsg.includes("Invalid login") || errMsg.includes("Authentication") ||
          errMsg.includes("Invalid recipient") || errMsg.includes("550")) {
        throw err;
      }

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 500; // 1s, 2s
        console.warn(`[mailer] Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}
