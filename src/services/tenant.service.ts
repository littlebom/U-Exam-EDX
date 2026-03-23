import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { buildPaginationMeta } from "@/types";
import type { PaginationParams, PaginationMeta } from "@/types";

interface TenantListResult {
  data: Array<Record<string, unknown>>;
  meta: PaginationMeta;
}

export async function listTenants(params: PaginationParams = {}): Promise<TenantListResult> {
  const page = params.page ?? 1;
  const perPage = params.perPage ?? 20;
  const skip = (page - 1) * perPage;

  const where: Record<string, unknown> = {};

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { slug: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: "desc" },
    }),
    prisma.tenant.count({ where }),
  ]);

  return {
    data: data as unknown as Array<Record<string, unknown>>,
    meta: buildPaginationMeta(page, perPage, total),
  };
}

export async function getTenant(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw errors.notFound("ไม่พบข้อมูลองค์กร");
  }

  return tenant;
}

export async function updateTenantSettings(
  tenantId: string,
  data: { name?: string; settings?: Record<string, unknown> }
) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.settings !== undefined
        ? { settings: data.settings as Parameters<typeof prisma.tenant.update>[0]["data"]["settings"] }
        : {}),
    },
  });
}
