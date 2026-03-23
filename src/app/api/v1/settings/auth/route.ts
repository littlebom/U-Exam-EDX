import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

// ─── Schema ─────────────────────────────────────────────────────────

const providerSchema = z.object({
  enabled: z.boolean().default(false),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  // Provider-specific fields
  tenantId: z.string().optional(), // Azure AD
  issuerUrl: z.string().optional(), // Keycloak
});

const authSettingsSchema = z.object({
  allowCredentialsLogin: z.boolean().default(true),
  allowSelfRegistration: z.boolean().default(true),
  providers: z.object({
    google: providerSchema.default({}),
    microsoft: providerSchema.default({}),
    keycloak: providerSchema.default({}),
    line: providerSchema.default({}),
    facebook: providerSchema.default({}),
  }).default({}),
});

// ─── GET — Load auth settings ───────────────────────────────────────

export async function GET() {
  try {
    const ctx = await requirePermission("tenant:settings");

    const tenant = await prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: { settings: true },
    });

    const settings = (tenant?.settings ?? {}) as Record<string, unknown>;
    const auth = (settings.auth ?? {}) as Record<string, unknown>;

    // Mask secrets before sending to client
    const providers = (auth.providers ?? {}) as Record<string, Record<string, unknown>>;
    const maskedProviders: Record<string, Record<string, unknown>> = {};

    for (const [key, config] of Object.entries(providers)) {
      maskedProviders[key] = {
        ...config,
        clientSecret: config.clientSecret ? "••••••••" : "",
        hasSecret: !!config.clientSecret,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        allowCredentialsLogin: auth.allowCredentialsLogin ?? true,
        allowSelfRegistration: auth.allowSelfRegistration ?? true,
        providers: maskedProviders,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── PUT — Update auth settings ─────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const ctx = await requirePermission("tenant:settings");
    const body = await req.json();
    const parsed = authSettingsSchema.parse(body);

    // Load current settings to preserve secrets that weren't changed
    const tenant = await prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: { settings: true },
    });

    const currentSettings = (tenant?.settings ?? {}) as Record<string, unknown>;
    const currentAuth = (currentSettings.auth ?? {}) as Record<string, unknown>;
    const currentProviders = (currentAuth.providers ?? {}) as Record<string, Record<string, unknown>>;

    // Merge providers — preserve existing secrets if masked value sent
    const mergedProviders: Record<string, unknown> = {};
    for (const [key, config] of Object.entries(parsed.providers)) {
      const current = currentProviders[key] ?? {};
      mergedProviders[key] = {
        ...config,
        // Keep existing secret if client sent masked value
        clientSecret:
          config.clientSecret === "••••••••" || !config.clientSecret
            ? current.clientSecret ?? ""
            : config.clientSecret,
      };
    }

    await prisma.tenant.update({
      where: { id: ctx.tenantId },
      data: {
        settings: {
          ...currentSettings,
          auth: {
            allowCredentialsLogin: parsed.allowCredentialsLogin,
            allowSelfRegistration: parsed.allowSelfRegistration,
            providers: mergedProviders,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: "บันทึกการตั้งค่า OAuth สำเร็จ" },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
