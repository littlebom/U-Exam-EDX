import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { handleApiError, errors } from "@/lib/errors";
import { z } from "zod";

const upsertSchema = z.object({
  frameworkId: z.string().uuid(),
  mappings: z.array(
    z.object({
      competencyAreaId: z.string().uuid(),
      weight: z.number().min(0).max(1),
    })
  ),
});

// GET — ดึง competency mappings ของวิชา
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("question-bank:read");
    const { id: subjectId } = await params;

    const maps = await prisma.subjectCompetencyMap.findMany({
      where: { subjectId },
      include: {
        competencyArea: {
          include: { framework: { select: { id: true, name: true } } },
        },
      },
      orderBy: { competencyArea: { order: "asc" } },
    });

    return NextResponse.json({
      success: true,
      data: maps.map((m) => ({
        id: m.id,
        subjectId: m.subjectId,
        competencyAreaId: m.competencyAreaId,
        competencyAreaName: m.competencyArea.name,
        frameworkId: m.competencyArea.framework.id,
        frameworkName: m.competencyArea.framework.name,
        weight: m.weight,
        color: m.competencyArea.color,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH — บันทึก competency mappings ของวิชา (upsert ทั้งชุด)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("question-bank:update");
    const { id: subjectId } = await params;
    const body = await req.json();
    const { frameworkId, mappings } = upsertSchema.parse(body);

    // Verify subject exists
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, tenantId: session.tenantId },
    });
    if (!subject) throw errors.notFound("ไม่พบวิชา");

    // Verify framework exists
    const framework = await prisma.competencyFramework.findFirst({
      where: { id: frameworkId, tenantId: session.tenantId },
    });
    if (!framework) throw errors.notFound("ไม่พบกรอบสมรรถนะ");

    // Transaction: delete old + insert new (atomic)
    await prisma.$transaction(async (tx) => {
      const frameworkAreas = await tx.competencyArea.findMany({
        where: { frameworkId },
        select: { id: true },
      });
      const areaIds = frameworkAreas.map((a) => a.id);

      await tx.subjectCompetencyMap.deleteMany({
        where: {
          subjectId,
          competencyAreaId: { in: areaIds },
        },
      });

      const toInsert = mappings.filter((m) => m.weight > 0);
      if (toInsert.length > 0) {
        await tx.subjectCompetencyMap.createMany({
          data: toInsert.map((m) => ({
            subjectId,
            competencyAreaId: m.competencyAreaId,
            weight: m.weight,
          })),
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: { message: "บันทึกสมรรถนะสำเร็จ" },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
