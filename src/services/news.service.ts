import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { buildPaginationMeta } from "@/types";
import type { CreateNews, UpdateNews, NewsFilter } from "@/lib/validations/news";

// ═══════════════════════════════════════════════════════════════════
// News CRUD
// ═══════════════════════════════════════════════════════════════════

/**
 * List news with pagination and filters.
 */
export async function listNews(tenantId: string, filters: NewsFilter) {
  const { status, search, page, perPage } = filters;

  const where: Record<string, unknown> = {
    tenantId,
    ...(status && { status }),
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.news.findMany({
      where: where as never,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.news.count({ where: where as never }),
  ]);

  return { data, meta: buildPaginationMeta(page, perPage, total) };
}

/**
 * List published news for public view.
 */
export async function listPublishedNews(filters: { page: number; perPage: number }) {
  const { page, perPage } = filters;

  const where = { status: "PUBLISHED" as const };

  const [data, total] = await Promise.all([
    prisma.news.findMany({
      where,
      select: {
        id: true,
        title: true,
        content: true,
        coverImage: true,
        publishedAt: true,
        createdAt: true,
        tenant: { select: { name: true, logoUrl: true } },
      },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.news.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, perPage, total) };
}

/**
 * Get a single news item.
 */
export async function getNews(tenantId: string, id: string) {
  const news = await prisma.news.findFirst({
    where: { id, tenantId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!news) throw errors.notFound("ไม่พบข่าวสาร");
  return news;
}

/**
 * Create news.
 */
export async function createNews(
  tenantId: string,
  userId: string,
  data: CreateNews
) {
  const publishedAt =
    data.status === "PUBLISHED" ? new Date() : null;

  return prisma.news.create({
    data: {
      tenantId,
      createdById: userId,
      title: data.title,
      content: data.content,
      coverImage: data.coverImage || null,
      status: data.status,
      publishedAt,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Update news.
 */
export async function updateNews(
  tenantId: string,
  id: string,
  data: UpdateNews
) {
  const existing = await prisma.news.findFirst({
    where: { id, tenantId },
  });
  if (!existing) throw errors.notFound("ไม่พบข่าวสาร");

  // Set publishedAt when status changes to PUBLISHED
  let publishedAt = existing.publishedAt;
  if (data.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
    publishedAt = new Date();
  } else if (data.status === "DRAFT") {
    publishedAt = null;
  }

  return prisma.news.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.coverImage !== undefined && {
        coverImage: data.coverImage || null,
      }),
      ...(data.status !== undefined && { status: data.status }),
      publishedAt,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Delete news.
 */
export async function deleteNews(tenantId: string, id: string) {
  const existing = await prisma.news.findFirst({
    where: { id, tenantId },
  });
  if (!existing) throw errors.notFound("ไม่พบข่าวสาร");

  return prisma.news.delete({ where: { id } });
}
