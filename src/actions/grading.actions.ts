"use server";

import { getSessionTenant } from "@/lib/get-session";
import {
  gradeAnswerSchema,
  batchGradeSchema,
  adjustScoreSchema,
  bulkPublishSchema,
  createRubricSchema,
  updateRubricSchema,
} from "@/lib/validations/grading";
import {
  gradeAnswer,
  batchGrade,
  adjustScore,
  publishGrade,
  bulkPublishGrades,
  createRubric,
  updateRubric,
  deleteRubric,
} from "@/services/grading.service";
import { autoGradeSession } from "@/services/auto-grading.service";
import type { ActionResult } from "@/types";

// ─── Auto-grade Session ─────────────────────────────────────────────

export async function autoGradeAction(
  sessionId: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const result = await autoGradeSession(session.tenantId, sessionId);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

// ─── Grade Single Answer ────────────────────────────────────────────

export async function gradeAnswerAction(
  gradeId: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const parsed = gradeAnswerSchema.parse(input);
    const result = await gradeAnswer(session.tenantId, gradeId, session.userId, parsed);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

// ─── Batch Grade ────────────────────────────────────────────────────

export async function batchGradeAction(
  gradeId: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const parsed = batchGradeSchema.parse(input);
    const result = await batchGrade(session.tenantId, gradeId, session.userId, parsed);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

// ─── Adjust Score ───────────────────────────────────────────────────

export async function adjustScoreAction(
  gradeId: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const parsed = adjustScoreSchema.parse(input);
    const result = await adjustScore(session.tenantId, gradeId, session.userId, parsed);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

// ─── Publish Grade ──────────────────────────────────────────────────

export async function publishGradeAction(
  gradeId: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const result = await publishGrade(session.tenantId, gradeId);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

// ─── Bulk Publish Grades ─────────────────────────────────────────────

export async function bulkPublishGradesAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const parsed = bulkPublishSchema.parse(input);
    const result = await bulkPublishGrades(session.tenantId, parsed.gradeIds);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

// ─── Create Rubric ──────────────────────────────────────────────────

export async function createRubricAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const parsed = createRubricSchema.parse(input);
    const result = await createRubric(session.tenantId, parsed);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

// ─── Update Rubric ──────────────────────────────────────────────────

export async function updateRubricAction(
  rubricId: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const parsed = updateRubricSchema.parse(input);
    const result = await updateRubric(session.tenantId, rubricId, parsed);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

// ─── Delete Rubric ──────────────────────────────────────────────────

export async function deleteRubricAction(
  rubricId: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    await deleteRubric(session.tenantId, rubricId);
    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}
