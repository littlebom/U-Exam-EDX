import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";

// ============================================================
// Types
// ============================================================

interface CreateCategoryData {
  name: string;
  description?: string | null;
  sortOrder?: number;
}

interface UpdateCategoryData {
  name?: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

interface CreateTagData {
  name: string;
  color?: string | null;
}

interface UpdateTagData {
  name?: string;
  color?: string | null;
}

// ============================================================
// Category Functions
// ============================================================

/**
 * Get ALL categories as a flat list with subject count.
 * Categories are typically small in number, so no pagination is needed.
 */
export async function listCategories(tenantId: string) {
  return prisma.category.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: {
          subjects: true,
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

/**
 * Create a new category for a tenant.
 */
export async function createCategory(tenantId: string, data: CreateCategoryData) {
  return prisma.category.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description,
      sortOrder: data.sortOrder ?? 0,
    },
    include: {
      _count: {
        select: { subjects: true },
      },
    },
  });
}

/**
 * Update an existing category.
 * Validates tenant ownership.
 */
export async function updateCategory(
  tenantId: string,
  id: string,
  data: UpdateCategoryData
) {
  // Verify the category belongs to this tenant
  const existing = await prisma.category.findFirst({
    where: { id, tenantId },
  });

  if (!existing) {
    throw errors.notFound("ไม่พบหมวดหมู่");
  }

  return prisma.category.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
    include: {
      _count: {
        select: { subjects: true },
      },
    },
  });
}

/**
 * Delete a category.
 * Throws conflict if the category has subjects assigned.
 */
export async function deleteCategory(tenantId: string, id: string) {
  const category = await prisma.category.findFirst({
    where: { id, tenantId },
    include: {
      _count: {
        select: { subjects: true },
      },
    },
  });

  if (!category) {
    throw errors.notFound("ไม่พบหมวดหมู่");
  }

  // Prevent deletion if subjects are assigned
  if (category._count.subjects > 0) {
    throw errors.conflict("ไม่สามารถลบหมวดหมู่ที่มีวิชาอยู่");
  }

  await prisma.category.delete({
    where: { id },
  });
}

// ============================================================
// Tag Functions
// ============================================================

/**
 * Get all tags for a tenant with question count.
 */
export async function listTags(tenantId: string) {
  return prisma.tag.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: { questionTags: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Create a new tag for a tenant.
 */
export async function createTag(tenantId: string, data: CreateTagData) {
  return prisma.tag.create({
    data: {
      tenantId,
      name: data.name,
      color: data.color,
    },
    include: {
      _count: {
        select: { questionTags: true },
      },
    },
  });
}

/**
 * Update an existing tag.
 */
export async function updateTag(tenantId: string, id: string, data: UpdateTagData) {
  const existing = await prisma.tag.findFirst({
    where: { id, tenantId },
  });

  if (!existing) {
    throw errors.notFound("ไม่พบแท็ก");
  }

  return prisma.tag.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.color !== undefined ? { color: data.color } : {}),
    },
    include: {
      _count: {
        select: { questionTags: true },
      },
    },
  });
}

/**
 * Delete a tag. QuestionTag records cascade-delete via the Prisma schema.
 */
export async function deleteTag(tenantId: string, id: string) {
  const existing = await prisma.tag.findFirst({
    where: { id, tenantId },
  });

  if (!existing) {
    throw errors.notFound("ไม่พบแท็ก");
  }

  await prisma.tag.delete({
    where: { id },
  });
}
