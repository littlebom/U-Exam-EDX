"use server";

import { requirePermission } from "@/lib/rbac";
import {
  createQuestionGroup,
  updateQuestionGroup,
  deleteQuestionGroup,
} from "@/services/question-group.service";
import {
  createQuestionGroupSchema,
  updateQuestionGroupSchema,
} from "@/lib/validations/question-group";
import type { ActionResult } from "@/types";
import { formatZodErrors, handleActionError } from "@/lib/action-utils";

export async function createQuestionGroupAction(
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("question:create");
    const parsed = createQuestionGroupSchema.safeParse(data);
    if (!parsed.success) return formatZodErrors(parsed.error);

    const group = await createQuestionGroup(session.tenantId, parsed.data);
    return { success: true, data: { id: group.id } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateQuestionGroupAction(
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("question:update");
    const parsed = updateQuestionGroupSchema.safeParse(data);
    if (!parsed.success) return formatZodErrors(parsed.error);

    const { id, ...rest } = parsed.data;
    const group = await updateQuestionGroup(session.tenantId, id, rest);
    return { success: true, data: { id: group.id } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteQuestionGroupAction(
  groupId: string
): Promise<ActionResult> {
  try {
    const session = await requirePermission("question:delete");
    await deleteQuestionGroup(session.tenantId, groupId);
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}
