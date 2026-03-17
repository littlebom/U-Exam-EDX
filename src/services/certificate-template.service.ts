import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type { Prisma } from "@/generated/prisma";

// ─── List Templates ─────────────────────────────────────────────────

export async function listCertificateTemplates(
  tenantId: string,
  filters: { page?: number; perPage?: number; isActive?: boolean } = {}
) {
  const { page = 1, perPage = 20, isActive } = filters;

  const where: Record<string, unknown> = { tenantId };
  if (isActive !== undefined) where.isActive = isActive;

  const [total, templates] = await Promise.all([
    prisma.certificateTemplate.count({ where }),
    prisma.certificateTemplate.findMany({
      where,
      include: {
        _count: { select: { certificates: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    data: templates.map((t) => ({
      id: t.id,
      name: t.name,
      isDefault: t.isDefault,
      isActive: t.isActive,
      certificateCount: t._count.certificates,
      createdAt: t.createdAt,
    })),
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  };
}

// ─── Get Template Detail ────────────────────────────────────────────

export async function getCertificateTemplate(tenantId: string, id: string) {
  const template = await prisma.certificateTemplate.findFirst({
    where: { id, tenantId },
  });
  if (!template) throw errors.notFound("ไม่พบเทมเพลต");
  return template;
}

// ─── Create Template ────────────────────────────────────────────────

export async function createCertificateTemplate(
  tenantId: string,
  data: {
    name: string;
    design: Record<string, unknown>;
    variables?: Array<{ name: string; description: string; default?: string }>;
    isDefault?: boolean;
  }
) {
  // If setting as default, unset other defaults
  if (data.isDefault) {
    await prisma.certificateTemplate.updateMany({
      where: { tenantId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.certificateTemplate.create({
    data: {
      tenantId,
      name: data.name,
      design: data.design as Prisma.InputJsonValue,
      variables: data.variables
        ? (data.variables as unknown as Prisma.InputJsonValue)
        : undefined,
      isDefault: data.isDefault ?? false,
    },
  });
}

// ─── Update Template ────────────────────────────────────────────────

export async function updateCertificateTemplate(
  tenantId: string,
  id: string,
  data: {
    name?: string;
    design?: Record<string, unknown>;
    variables?: Array<{ name: string; description: string; default?: string }>;
    isDefault?: boolean;
    isActive?: boolean;
  }
) {
  const template = await prisma.certificateTemplate.findFirst({
    where: { id, tenantId },
  });
  if (!template) throw errors.notFound("ไม่พบเทมเพลต");

  if (data.isDefault) {
    await prisma.certificateTemplate.updateMany({
      where: { tenantId, isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  return prisma.certificateTemplate.update({
    where: { id },
    data: {
      name: data.name,
      design: data.design
        ? (data.design as Prisma.InputJsonValue)
        : undefined,
      variables: data.variables
        ? (data.variables as unknown as Prisma.InputJsonValue)
        : undefined,
      isDefault: data.isDefault,
      isActive: data.isActive,
    },
  });
}

// ─── Delete Template ────────────────────────────────────────────────

export async function deleteCertificateTemplate(tenantId: string, id: string) {
  const template = await prisma.certificateTemplate.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { certificates: true } } },
  });
  if (!template) throw errors.notFound("ไม่พบเทมเพลต");
  if (template._count.certificates > 0) {
    throw errors.validation("ไม่สามารถลบเทมเพลตที่มีใบรับรองแล้ว");
  }

  return prisma.certificateTemplate.delete({ where: { id } });
}
