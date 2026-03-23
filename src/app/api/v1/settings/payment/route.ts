import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import {
  isStripeConfigured,
  getStripeMode,
  maskStripeKey,
} from "@/lib/stripe";
import { handleApiError } from "@/lib/errors";

// GET — Return payment gateway settings
export async function GET() {
  try {
    const session = await requirePermission("tenant:settings");

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { settings: true },
    });

    const settings = (tenant?.settings ?? {}) as Record<string, unknown>;
    const stripeEnabled = settings.stripeEnabled ?? true;
    const paymentMethods = (settings.paymentMethods as string[]) ?? [
      "CREDIT_CARD",
      "PROMPTPAY",
    ];

    const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY ?? "";
    const webhookUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/webhooks/stripe`;

    return NextResponse.json({
      success: true,
      data: {
        isConfigured: isStripeConfigured(),
        mode: getStripeMode(),
        maskedSecretKey: secretKey ? maskStripeKey(secretKey) : "",
        maskedPublishableKey: publishableKey ? maskStripeKey(publishableKey) : "",
        webhookUrl,
        stripeEnabled,
        paymentMethods,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH — Update payment gateway settings (enable/disable, methods)
export async function PATCH(req: NextRequest) {
  try {
    const session = await requirePermission("tenant:settings");
    const body = await req.json();

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { settings: true },
    });

    const currentSettings = (tenant?.settings ?? {}) as Record<string, unknown>;

    if (body.stripeEnabled !== undefined) {
      currentSettings.stripeEnabled = !!body.stripeEnabled;
    }
    if (Array.isArray(body.paymentMethods)) {
      const validMethods = ["CREDIT_CARD", "PROMPTPAY"];
      currentSettings.paymentMethods = body.paymentMethods.filter((m: string) =>
        validMethods.includes(m)
      );
    }

    await prisma.tenant.update({
      where: { id: session.tenantId },
      data: { settings: currentSettings as Prisma.InputJsonValue },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
