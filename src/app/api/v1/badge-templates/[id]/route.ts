import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { handleApiError, errors } from "@/lib/errors";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  minScore: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(0).max(100).optional(),
  badgeColor: z.string().optional(),
  badgeIcon: z.string().optional(),
  badgeLabel: z.string().optional(),
  examId: z.string().uuid().optional().nullable(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// PUT — Update badge template
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("certificate:manage");
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const existing = await prisma.badgeTemplate.findFirst({
      where: { id, tenantId: session.tenantId },
    });
    if (!existing) throw errors.notFound("ไม่พบ Badge Template");

    const updated = await prisma.badgeTemplate.update({
      where: { id },
      data,
      include: {
        exam: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE — Delete badge template
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("certificate:manage");
    const { id } = await params;

    const existing = await prisma.badgeTemplate.findFirst({
      where: { id, tenantId: session.tenantId },
    });
    if (!existing) throw errors.notFound("ไม่พบ Badge Template");

    await prisma.badgeTemplate.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    return handleApiError(error);
  }
}
