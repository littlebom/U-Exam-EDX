import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { handleApiError } from "@/lib/errors";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { z } from "zod";

// ─── GET — Load SMTP config (mask password) ─────────────────────────

export async function GET() {
  try {
    const session = await requirePermission("tenant:settings");

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { settings: true },
    });

    const settings = (tenant?.settings ?? {}) as Record<string, unknown>;
    const smtp = (settings.smtp ?? {}) as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      data: {
        host: (smtp.host as string) ?? "",
        port: (smtp.port as number) ?? 587,
        user: (smtp.user as string) ?? "",
        password: smtp.password ? "••••••••" : "",
        from: (smtp.from as string) ?? "",
        hasPassword: !!smtp.password,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── PATCH — Save SMTP config ───────────────────────────────────────

const smtpSchema = z.object({
  host: z.string().min(1, "กรุณาระบุ SMTP Host"),
  port: z.coerce.number().int().min(1).max(65535).default(587),
  user: z.string().min(1, "กรุณาระบุ Username"),
  password: z.string().optional(),
  from: z.string().min(1, "กรุณาระบุ From Address"),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await requirePermission("tenant:settings");
    const body = await req.json();
    const data = smtpSchema.parse(body);

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { settings: true },
    });

    const currentSettings = (tenant?.settings ?? {}) as Record<string, unknown>;
    const existingSmtp = (currentSettings.smtp ?? {}) as Record<string, unknown>;

    // Keep existing password if not provided (masked), encrypt before storing
    const rawPassword =
      data.password && data.password !== "••••••••"
        ? data.password
        : decryptSecret((existingSmtp.password as string) ?? "");

    currentSettings.smtp = {
      host: data.host,
      port: data.port,
      user: data.user,
      password: rawPassword ? encryptSecret(rawPassword) : "",
      from: data.from,
    };

    await prisma.tenant.update({
      where: { id: session.tenantId },
      data: { settings: currentSettings as Prisma.InputJsonValue },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

// Test email is handled by /api/v1/settings/email/test/route.ts (GET)
