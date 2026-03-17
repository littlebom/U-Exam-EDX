"use server";

import { requirePermission } from "@/lib/rbac";
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "@/services/question.service";
import { createQuestionSchema, updateQuestionSchema } from "@/lib/validations/question";
import type { ActionResult } from "@/types";
import { formatZodErrors, handleActionError } from "@/lib/action-utils";

export async function createQuestionAction(
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("question:create");
    const parsed = createQuestionSchema.safeParse(data);
    if (!parsed.success) return formatZodErrors(parsed.error);

    const { tagIds, media, ...questionData } = parsed.data;
    const question = await createQuestion(
      session.tenantId,
      session.userId,
      { ...questionData, tagIds: tagIds ?? [], media: media ?? [] }
    );

    return { success: true, data: { id: question.id } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateQuestionAction(
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("question:update");
    const parsed = updateQuestionSchema.safeParse(data);
    if (!parsed.success) return formatZodErrors(parsed.error);

    const { id, tagIds, media, ...questionData } = parsed.data;
    const question = await updateQuestion(
      session.tenantId,
      id,
      session.userId,
      { ...questionData, tagIds, media }
    );

    return { success: true, data: { id: question.id } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteQuestionAction(
  questionId: string
): Promise<ActionResult> {
  try {
    const session = await requirePermission("question:delete");
    await deleteQuestion(session.tenantId, questionId, session.userId);
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}
