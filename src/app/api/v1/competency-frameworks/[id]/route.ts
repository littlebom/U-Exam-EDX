import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { handleApiError, errors } from "@/lib/errors";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  areas: z.array(z.object({
    id: z.string().uuid().optional(), // existing area
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    icon: z.string().max(50).optional(),
    color: z.string().max(20).optional(),
  })).optional(),
});

// ─── GET — Single framework ─────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePermission("exam:list");
    const { id } = await params;

    const framework = await prisma.competencyFramework.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        areas: { orderBy: { order: "asc" } },
        _count: { select: { exams: true } },
      },
    });

    if (!framework) throw errors.notFound("ไม่พบกรอบสมรรถนะ");

    return NextResponse.json({ success: true, data: framework });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── PUT — Update framework + areas ─────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePermission("tenant:settings");
    const { id } = await params;
    const body = await req.json();
    const { name, description, isActive, areas } = updateSchema.parse(body);

    // Verify ownership
    const existing = await prisma.competencyFramework.findFirst({
      where: { id, tenantId: ctx.tenantId },
    });
    if (!existing) throw errors.notFound("ไม่พบกรอบสมรรถนะ");

    // Update framework
    const updated = await prisma.$transaction(async (tx) => {
      // Update framework fields
      await tx.competencyFramework.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(isActive !== undefined && { isActive }),
        },
      });

      // Upsert areas if provided (preserve existing IDs to keep SubjectCompetencyMap)
      if (areas) {
        const existingAreas = await tx.competencyArea.findMany({
          where: { frameworkId: id },
          select: { id: true },
        });
        const existingIds = existingAreas.map((a) => a.id);
        const incomingIds = areas.filter((a) => a.id).map((a) => a.id as string);

        // Delete areas that are no longer in the list
        const toDelete = existingIds.filter((eid) => !incomingIds.includes(eid));
        if (toDelete.length > 0) {
          await tx.competencyArea.deleteMany({
            where: { id: { in: toDelete } },
          });
        }

        // Upsert each area
        for (let i = 0; i < areas.length; i++) {
          const area = areas[i];
          if (area.id && existingIds.includes(area.id)) {
            // Update existing
            await tx.competencyArea.update({
              where: { id: area.id },
              data: {
                name: area.name,
                description: area.description,
                icon: area.icon,
                color: area.color,
                order: i,
              },
            });
          } else {
            // Create new
            await tx.competencyArea.create({
              data: {
                frameworkId: id,
                name: area.name,
                description: area.description,
                icon: area.icon,
                color: area.color,
                order: i,
              },
            });
          }
        }
      }

      return tx.competencyFramework.findUnique({
        where: { id },
        include: { areas: { orderBy: { order: "asc" } } },
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── DELETE — Delete framework ──────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePermission("tenant:settings");
    const { id } = await params;

    const existing = await prisma.competencyFramework.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        _count: { select: { exams: true } },
        areas: { include: { _count: { select: { subjectMaps: true } } } },
      },
    });
    if (!existing) throw errors.notFound("ไม่พบกรอบสมรรถนะ");

    if (existing._count.exams > 0) {
      throw errors.validation(
        `ไม่สามารถลบได้ — กรอบสมรรถนะนี้ถูกใช้ใน ${existing._count.exams} ชุดสอบ`
      );
    }

    const subjectMapCount = existing.areas.reduce((sum, a) => sum + a._count.subjectMaps, 0);
    if (subjectMapCount > 0) {
      throw errors.validation(
        `ไม่สามารถลบได้ — กรอบสมรรถนะนี้ถูกใช้ในการตั้งค่าสมรรถนะ ${subjectMapCount} รายการ`
      );
    }

    await prisma.competencyFramework.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { message: "ลบกรอบสมรรถนะสำเร็จ" } });
  } catch (error) {
    return handleApiError(error);
  }
}
