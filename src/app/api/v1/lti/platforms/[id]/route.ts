import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { handleApiError, errors } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/services/audit-log.service";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("tenant:settings");
    const { id } = await context.params;

    const platform = await prisma.ltiPlatform.findFirst({
      where: { id, tenantId: session.tenantId },
    });

    if (!platform) {
      throw errors.notFound("LTI platform not found");
    }

    const [userCount, launchCount] = await Promise.all([
      prisma.ltiUserLink.count({ where: { platformId: id } }),
      prisma.ltiLaunchLog.count({ where: { platformId: id } }),
    ]);

    // Exclude private key from response
    const { privateKey: _pk, ...platformData } = platform;

    return NextResponse.json({
      success: true,
      data: { ...platformData, userCount, launchCount },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  issuer: z.string().url().optional(),
  clientId: z.string().min(1).optional(),
  deploymentId: z.string().optional(),
  authLoginUrl: z.string().url().optional(),
  authTokenUrl: z.string().url().optional(),
  jwksUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("tenant:settings");
    const { id } = await context.params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const existing = await prisma.ltiPlatform.findFirst({
      where: { id, tenantId: session.tenantId },
    });

    if (!existing) {
      throw errors.notFound("LTI platform not found");
    }

    const updated = await prisma.ltiPlatform.update({
      where: { id },
      data,
    });

    await logAudit({
      action: "lti_platform.update",
      userId: session.userId,
      tenantId: session.tenantId,
      targetId: id,
      targetType: "LtiPlatform",
      detail: data,
    });

    const { privateKey: _pk, ...platformData } = updated;

    return NextResponse.json({ success: true, data: platformData });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("tenant:settings");
    const { id } = await context.params;

    const existing = await prisma.ltiPlatform.findFirst({
      where: { id, tenantId: session.tenantId },
    });

    if (!existing) {
      throw errors.notFound("LTI platform not found");
    }

    await prisma.ltiPlatform.delete({ where: { id } });

    await logAudit({
      action: "lti_platform.delete",
      userId: session.userId,
      tenantId: session.tenantId,
      targetId: id,
      targetType: "LtiPlatform",
      detail: { name: existing.name },
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
