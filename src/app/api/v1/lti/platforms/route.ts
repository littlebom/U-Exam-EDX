import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/errors";
import { parsePagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { generateLtiKeyPair } from "@/services/lti.service";
import { encryptSecret } from "@/lib/crypto";
import { logAudit } from "@/services/audit-log.service";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("tenant:settings");
    const { page, perPage } = parsePagination(req.nextUrl.searchParams);

    const where = { tenantId: session.tenantId };

    const [platforms, total] = await Promise.all([
      prisma.ltiPlatform.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          name: true,
          issuer: true,
          clientId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.ltiPlatform.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: platforms,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(255),
  issuer: z.string().url(),
  clientId: z.string().min(1),
  deploymentId: z.string().optional(),
  authLoginUrl: z.string().url(),
  authTokenUrl: z.string().url(),
  jwksUrl: z.string().url(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("tenant:settings");
    const body = await req.json();
    const data = createSchema.parse(body);

    const { publicKey, privateKey, kid } = await generateLtiKeyPair();

    const platform = await prisma.ltiPlatform.create({
      data: {
        ...data,
        tenantId: session.tenantId,
        kid,
        publicKey,
        privateKey: encryptSecret(privateKey),
        isActive: true,
      },
    });

    await logAudit({
      action: "lti_platform.create",
      userId: session.userId,
      tenantId: session.tenantId,
      targetId: platform.id,
      targetType: "LtiPlatform",
      detail: { name: data.name, issuer: data.issuer },
    });

    return NextResponse.json({ success: true, data: platform }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
