import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  areas: z.array(z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    icon: z.string().max(50).optional(),
    color: z.string().max(20).optional(),
  })).min(1, "ต้องมีอย่างน้อย 1 ด้าน"),
});

// ─── GET — List frameworks ──────────────────────────────────────────

export async function GET() {
  try {
    const ctx = await requirePermission("exam:list");

    const frameworks = await prisma.competencyFramework.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        areas: { orderBy: { order: "asc" } },
        _count: { select: { exams: true } },
      },
    });

    return NextResponse.json({ success: true, data: frameworks });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── POST — Create framework with areas ─────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const ctx = await requirePermission("tenant:settings");
    const body = await req.json();
    const { name, description, areas } = createSchema.parse(body);

    const framework = await prisma.competencyFramework.create({
      data: {
        tenantId: ctx.tenantId,
        name,
        description,
        areas: {
          create: areas.map((area, i) => ({
            name: area.name,
            description: area.description,
            icon: area.icon,
            color: area.color,
            order: i,
          })),
        },
      },
      include: {
        areas: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({ success: true, data: framework }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
