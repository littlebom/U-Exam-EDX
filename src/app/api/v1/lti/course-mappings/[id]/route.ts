import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { handleApiError, errors } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/services/audit-log.service";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("tenant:settings");
    const { id } = await context.params;
    const body = await req.json();

    const updateSchema = z.object({
      examId: z.string().uuid().optional(),
      resourceLinkId: z.string().max(500).optional().nullable(),
      contextId: z.string().max(500).optional().nullable(),
      contextTitle: z.string().max(500).optional().nullable(),
      isActive: z.boolean().optional(),
    });

    const data = updateSchema.parse(body);

    // Verify mapping belongs to tenant via platform
    const existing = await prisma.ltiCourseMapping.findFirst({
      where: { id, platform: { tenantId: session.tenantId } },
    });

    if (!existing) {
      throw errors.notFound("Course mapping not found");
    }

    // If examId changed, verify new exam exists
    if (data.examId) {
      const exam = await prisma.exam.findUnique({
        where: { id: data.examId },
        select: { id: true },
      });
      if (!exam) {
        throw errors.notFound("Exam not found");
      }
    }

    const updated = await prisma.ltiCourseMapping.update({
      where: { id },
      data,
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
      detail: { type: "lti_course_mapping.update", targetId: id, ...data },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("tenant:settings");
    const { id } = await context.params;

    // Verify mapping belongs to tenant via platform
    const existing = await prisma.ltiCourseMapping.findFirst({
      where: { id, platform: { tenantId: session.tenantId } },
      select: { id: true, contextTitle: true },
    });

    if (!existing) {
      throw errors.notFound("Course mapping not found");
    }

    await prisma.ltiCourseMapping.delete({ where: { id } });

    await logAudit({
      action: "SETTINGS_UPDATE",
      category: "ADMIN",
      userId: session.userId,
      tenantId: session.tenantId,
      detail: { type: "lti_course_mapping.delete", targetId: id, contextTitle: existing.contextTitle },
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
