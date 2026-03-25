import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { handleApiError, errors } from "@/lib/errors";
import { parsePagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/services/audit-log.service";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("tenant:settings");
    const { page, perPage } = parsePagination(req.nextUrl.searchParams);
    const platformId = req.nextUrl.searchParams.get("platformId");

    const where = {
      platform: { tenantId: session.tenantId },
      ...(platformId && { platformId }),
    };

    const [mappings, total] = await Promise.all([
      prisma.ltiCourseMapping.findMany({
        where,
        include: {
          platform: { select: { id: true, name: true } },
          exam: { select: { id: true, title: true } },
          _count: { select: { userLinks: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.ltiCourseMapping.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: mappings,
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
  platformId: z.string().uuid(),
  examId: z.string().uuid(),
  resourceLinkId: z.string().max(500).optional(),
  contextId: z.string().max(500).optional(),
  contextTitle: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("tenant:settings");
    const body = await req.json();
    const data = createSchema.parse(body);

    // Verify platform belongs to this tenant
    const platform = await prisma.ltiPlatform.findFirst({
      where: { id: data.platformId, tenantId: session.tenantId },
      select: { id: true },
    });
    if (!platform) {
      throw errors.notFound("LTI platform not found");
    }

    // Verify exam exists
    const exam = await prisma.exam.findUnique({
      where: { id: data.examId },
      select: { id: true },
    });
    if (!exam) {
      throw errors.notFound("Exam not found");
    }

    const mapping = await prisma.ltiCourseMapping.create({
      data: {
        platformId: data.platformId,
        examId: data.examId,
        resourceLinkId: data.resourceLinkId ?? null,
        contextId: data.contextId ?? null,
        contextTitle: data.contextTitle ?? null,
        isActive: true,
      },
      include: {
        platform: { select: { id: true, name: true } },
        exam: { select: { id: true, title: true } },
        _count: { select: { userLinks: true } },
      },
    });

    await logAudit({
      action: "SETTINGS_UPDATE",
      category: "ADMIN",
      userId: session.userId,
      tenantId: session.tenantId,
      detail: {
        type: "lti_course_mapping.create",
        targetId: mapping.id,
        platformId: data.platformId,
        examId: data.examId,
        contextId: data.contextId,
      },
    });

    return NextResponse.json({ success: true, data: mapping }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
