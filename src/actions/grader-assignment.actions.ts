"use server";

import { getSessionTenant } from "@/lib/get-session";
import {
  createGraderAssignment,
  updateGraderAssignment,
  deleteGraderAssignment,
} from "@/services/grader-assignment.service";
import { z } from "zod";
import type { ActionResult } from "@/types";

const createSchema = z.object({
  examId: z.string().uuid(),
  userId: z.string().uuid(),
  scope: z.enum(["ALL", "SECTION"]).optional(),
  sectionId: z.string().uuid().optional(),
});

const updateSchema = z.object({
  scope: z.enum(["ALL", "SECTION"]).optional(),
  sectionId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function createGraderAssignmentAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const parsed = createSchema.parse(input);
    const result = await createGraderAssignment(session.tenantId, parsed);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

export async function updateGraderAssignmentAction(
  assignmentId: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const parsed = updateSchema.parse(input);
    const result = await updateGraderAssignment(
      session.tenantId,
      assignmentId,
      parsed
    );
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

export async function deleteGraderAssignmentAction(
  assignmentId: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    await deleteGraderAssignment(session.tenantId, assignmentId);
    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}
