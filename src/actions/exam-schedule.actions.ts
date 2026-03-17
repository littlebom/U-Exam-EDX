"use server";

import { requirePermission } from "@/lib/rbac";
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  cancelSchedule,
} from "@/services/exam-schedule.service";
import {
  createScheduleSchema,
  updateScheduleSchema,
} from "@/lib/validations/exam";
import type { ActionResult } from "@/types";

export async function createScheduleAction(
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("exam:schedule");

    const parsed = createScheduleSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "form";
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return { success: false, fieldErrors };
    }

    const schedule = await createSchedule(session.tenantId, parsed.data);
    return { success: true, data: { id: schedule.id } };
  } catch (error) {
    console.error("Create schedule error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

export async function updateScheduleAction(
  scheduleId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("exam:schedule");

    const parsed = updateScheduleSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "form";
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return { success: false, fieldErrors };
    }

    const schedule = await updateSchedule(
      session.tenantId,
      scheduleId,
      parsed.data
    );
    return { success: true, data: { id: schedule.id } };
  } catch (error) {
    console.error("Update schedule error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

export async function deleteScheduleAction(
  scheduleId: string
): Promise<ActionResult> {
  try {
    const session = await requirePermission("exam:schedule");
    await deleteSchedule(session.tenantId, scheduleId);
    return { success: true };
  } catch (error) {
    console.error("Delete schedule error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

export async function cancelScheduleAction(
  scheduleId: string
): Promise<ActionResult> {
  try {
    const session = await requirePermission("exam:schedule");
    await cancelSchedule(session.tenantId, scheduleId);
    return { success: true };
  } catch (error) {
    console.error("Cancel schedule error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}
