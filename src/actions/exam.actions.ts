"use server";

import { requirePermission } from "@/lib/rbac";
import {
  createExam,
  updateExam,
  deleteExam,
  cloneExam,
  addSection,
  updateSection,
  deleteSection,
  addSectionQuestion,
  addSectionQuestions,
  removeSectionQuestion,
  reorderSections,
  reorderSectionQuestions,
} from "@/services/exam.service";
import { createQuestion } from "@/services/question.service";
import {
  generateFromBlueprints,
  simpleRandom,
  previewBlueprint,
} from "@/services/exam-blueprint.service";
import {
  createExamSchema,
  updateExamSchema,
  createSectionSchema,
  updateSectionSchema,
  addSectionQuestionSchema,
  addSectionQuestionsSchema,
  reorderSectionsSchema,
  reorderSectionQuestionsSchema,
  generateFromBlueprintSchema,
  simpleRandomSchema,
} from "@/lib/validations/exam";
import type { ActionResult } from "@/types";

export async function createExamAction(
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("exam:create");

    const parsed = createExamSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "form";
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return { success: false, fieldErrors };
    }

    const exam = await createExam(
      session.tenantId,
      session.userId,
      parsed.data
    );

    return { success: true, data: { id: exam.id } };
  } catch (error) {
    console.error("Create exam error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

export async function updateExamAction(
  examId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("exam:update");

    const parsed = updateExamSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "form";
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return { success: false, fieldErrors };
    }

    const exam = await updateExam(session.tenantId, examId, parsed.data);

    return { success: true, data: { id: exam.id } };
  } catch (error) {
    console.error("Update exam error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

export async function deleteExamAction(
  examId: string
): Promise<ActionResult> {
  try {
    const session = await requirePermission("exam:delete");
    await deleteExam(session.tenantId, examId);
    return { success: true };
  } catch (error) {
    console.error("Delete exam error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

export async function cloneExamAction(
  examId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("exam:create");
    const exam = await cloneExam(session.tenantId, session.userId, examId);
    return { success: true, data: { id: exam.id } };
  } catch (error) {
    console.error("Clone exam error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

export async function addSectionAction(
  examId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("exam:update");

    const parsed = createSectionSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "form";
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return { success: false, fieldErrors };
    }

    const section = await addSection(session.tenantId, examId, parsed.data);
    return { success: true, data: { id: section.id } };
  } catch (error) {
    console.error("Add section error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

export async function updateSectionAction(
  sectionId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("exam:update");

    const parsed = updateSectionSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "form";
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return { success: false, fieldErrors };
    }

    const section = await updateSection(
      session.tenantId,
      sectionId,
      parsed.data
    );
    return { success: true, data: { id: section.id } };
  } catch (error) {
    console.error("Update section error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

export async function deleteSectionAction(
  sectionId: string
): Promise<ActionResult> {
  try {
    const session = await requirePermission("exam:update");
    await deleteSection(session.tenantId, sectionId);
    return { success: true };
  } catch (error) {
    console.error("Delete section error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

export async function addSectionQuestionAction(
  sectionId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("exam:update");

    const parsed = addSectionQuestionSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "form";
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return { success: false, fieldErrors };
    }

    const link = await addSectionQuestion(
      session.tenantId,
      sectionId,
      parsed.data
    );
    return { success: true, data: { id: link.id } };
  } catch (error) {
    console.error("Add section question error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

export async function removeSectionQuestionAction(
  questionLinkId: string
): Promise<ActionResult> {
  try {
    const session = await requirePermission("exam:update");
    await removeSectionQuestion(session.tenantId, questionLinkId);
    return { success: true };
  } catch (error) {
    console.error("Remove section question error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Batch add questions to section
// ---------------------------------------------------------------------------

export async function addSectionQuestionsAction(
  sectionId: string,
  data: unknown
): Promise<ActionResult<{ added: number }>> {
  try {
    const session = await requirePermission("exam:update");

    const parsed = addSectionQuestionsSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "form";
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return { success: false, fieldErrors };
    }

    const result = await addSectionQuestions(
      session.tenantId,
      sectionId,
      parsed.data.questionIds,
      parsed.data.pointsOverride
    );

    return { success: true, data: { added: result.added } };
  } catch (error) {
    console.error("Batch add section questions error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Reorder sections
// ---------------------------------------------------------------------------

export async function reorderSectionsAction(
  examId: string,
  data: unknown
): Promise<ActionResult> {
  try {
    const session = await requirePermission("exam:update");

    const parsed = reorderSectionsSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "ข้อมูลไม่ถูกต้อง" };
    }

    await reorderSections(session.tenantId, examId, parsed.data.sectionIds);
    return { success: true };
  } catch (error) {
    console.error("Reorder sections error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Reorder section questions
// ---------------------------------------------------------------------------

export async function reorderSectionQuestionsAction(
  sectionId: string,
  data: unknown
): Promise<ActionResult> {
  try {
    const session = await requirePermission("exam:update");

    const parsed = reorderSectionQuestionsSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "ข้อมูลไม่ถูกต้อง" };
    }

    await reorderSectionQuestions(
      session.tenantId,
      sectionId,
      parsed.data.questionLinkIds
    );
    return { success: true };
  } catch (error) {
    console.error("Reorder section questions error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Generate questions from blueprint rules
// ---------------------------------------------------------------------------

export async function generateFromBlueprintsAction(
  data: unknown
): Promise<ActionResult<{ added: number }>> {
  try {
    const session = await requirePermission("exam:update");

    const parsed = generateFromBlueprintSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "form";
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return { success: false, fieldErrors };
    }

    const result = await generateFromBlueprints(
      session.tenantId,
      parsed.data.sectionId,
      parsed.data.rules
    );

    return { success: true, data: { added: result.added } };
  } catch (error) {
    console.error("Generate from blueprints error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Simple random pick
// ---------------------------------------------------------------------------

export async function simpleRandomAction(
  data: unknown
): Promise<ActionResult<{ added: number }>> {
  try {
    const session = await requirePermission("exam:update");

    const parsed = simpleRandomSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "form";
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return { success: false, fieldErrors };
    }

    const result = await simpleRandom(
      session.tenantId,
      parsed.data.sectionId,
      {
        subjectId: parsed.data.subjectId,
        questionGroupId: parsed.data.questionGroupId,
        count: parsed.data.count,
        points: parsed.data.points,
      }
    );

    return { success: true, data: { added: result.added } };
  } catch (error) {
    console.error("Simple random error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Preview blueprint availability
// ---------------------------------------------------------------------------

export async function previewBlueprintAction(
  data: unknown
): Promise<ActionResult<Array<{
  difficulty: string | null | undefined;
  count: number;
  points: number;
  available: number;
  sufficient: boolean;
}>>> {
  try {
    const session = await requirePermission("exam:read");

    const parsed = generateFromBlueprintSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "ข้อมูลไม่ถูกต้อง" };
    }

    const results = await previewBlueprint(
      session.tenantId,
      parsed.data.rules
    );

    return { success: true, data: results };
  } catch (error) {
    console.error("Preview blueprint error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Create exam-only question and add to section
// ---------------------------------------------------------------------------

export async function createExamOnlyQuestionAction(
  sectionId: string,
  examId: string,
  data: unknown
): Promise<ActionResult<{ questionId: string }>> {
  try {
    const session = await requirePermission("exam:update");

    // data should have the question fields
    const questionData = data as Record<string, unknown>;

    const question = await createQuestion(
      session.tenantId,
      session.userId,
      {
        type: questionData.type as string,
        difficulty: questionData.difficulty as string | undefined,
        content: questionData.content,
        options: questionData.options,
        correctAnswer: questionData.correctAnswer,
        explanation: questionData.explanation as string | undefined,
        points: questionData.points as number | undefined,
        status: "ACTIVE",
        subjectId: questionData.subjectId as string | undefined,
        questionGroupId: questionData.questionGroupId as string | undefined,
        isExamOnly: true,
        examId,
      }
    );

    // Add the question to the section
    await addSectionQuestion(session.tenantId, sectionId, {
      questionId: question.id,
    });

    return { success: true, data: { questionId: question.id } };
  } catch (error) {
    console.error("Create exam-only question error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}
