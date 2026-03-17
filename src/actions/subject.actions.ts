"use server";

import { requirePermission } from "@/lib/rbac";
import {
  createSubject,
  updateSubject,
  deleteSubject,
} from "@/services/subject.service";
import {
  createSubjectSchema,
  updateSubjectSchema,
} from "@/lib/validations/subject";
import type { ActionResult } from "@/types";
import { formatZodErrors, handleActionError } from "@/lib/action-utils";

export async function createSubjectAction(
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("question:create");
    const parsed = createSubjectSchema.safeParse(data);
    if (!parsed.success) return formatZodErrors(parsed.error);

    const subject = await createSubject(session.tenantId, parsed.data);
    return { success: true, data: { id: subject.id } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateSubjectAction(
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("question:update");
    const parsed = updateSubjectSchema.safeParse(data);
    if (!parsed.success) return formatZodErrors(parsed.error);

    const { id, ...rest } = parsed.data;
    const subject = await updateSubject(session.tenantId, id, rest);
    return { success: true, data: { id: subject.id } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteSubjectAction(
  subjectId: string
): Promise<ActionResult> {
  try {
    const session = await requirePermission("question:delete");
    await deleteSubject(session.tenantId, subjectId);
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}
