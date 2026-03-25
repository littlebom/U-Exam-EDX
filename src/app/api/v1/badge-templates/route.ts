import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  minScore: z.number().min(0).max(100),
  maxScore: z.number().min(0).max(100).default(100),
  badgeColor: z.string().default("#FFD700"),
  badgeIcon: z.string().default("trophy"),
  badgeLabel: z.string().default("CERTIFIED"),
  examId: z.string().uuid().optional().nullable(),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

// GET — List badge templates
export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("certificate:read");

    const templates = await prisma.badgeTemplate.findMany({
      where: { tenantId: session.tenantId },
      include: {
        exam: { select: { id: true, title: true } },
        _count: { select: { badges: true } },
      },
      orderBy: [{ priority: "desc" }, { minScore: "desc" }],
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST — Create badge template
export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("certificate:manage");
    const body = await req.json();
    const data = createSchema.parse(body);

    const template = await prisma.badgeTemplate.create({
      data: {
        tenantId: session.tenantId,
        ...data,
        examId: data.examId ?? null,
      },
      include: {
        exam: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
