"use server";

import { requirePermission } from "@/lib/rbac";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createTag,
  updateTag,
  deleteTag,
} from "@/services/category.service";
import {
  createCategorySchema,
  updateCategorySchema,
  createTagSchema,
  updateTagSchema,
} from "@/lib/validations/category";
import type { ActionResult } from "@/types";
import { formatZodErrors, handleActionError } from "@/lib/action-utils";

// ============================================================
// Category Actions
// ============================================================

export async function createCategoryAction(
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("question:create");
    const parsed = createCategorySchema.safeParse(data);
    if (!parsed.success) return formatZodErrors(parsed.error);

    const category = await createCategory(session.tenantId, parsed.data);
    return { success: true, data: { id: category.id } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateCategoryAction(
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("question:update");
    const parsed = updateCategorySchema.safeParse(data);
    if (!parsed.success) return formatZodErrors(parsed.error);

    const { id, ...rest } = parsed.data;
    const category = await updateCategory(session.tenantId, id, rest);
    return { success: true, data: { id: category.id } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteCategoryAction(
  categoryId: string
): Promise<ActionResult> {
  try {
    const session = await requirePermission("question:delete");
    await deleteCategory(session.tenantId, categoryId);
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

// ============================================================
// Tag Actions
// ============================================================

export async function createTagAction(
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("question:create");
    const parsed = createTagSchema.safeParse(data);
    if (!parsed.success) return formatZodErrors(parsed.error);

    const tag = await createTag(session.tenantId, parsed.data);
    return { success: true, data: { id: tag.id } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateTagAction(
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("question:update");
    const parsed = updateTagSchema.safeParse(data);
    if (!parsed.success) return formatZodErrors(parsed.error);

    const { id, ...rest } = parsed.data;
    const tag = await updateTag(session.tenantId, id, rest);
    return { success: true, data: { id: tag.id } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteTagAction(
  tagId: string
): Promise<ActionResult> {
  try {
    const session = await requirePermission("question:delete");
    await deleteTag(session.tenantId, tagId);
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}
