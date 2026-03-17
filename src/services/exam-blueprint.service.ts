import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { addSectionQuestions } from "./exam.service";
import type { Prisma } from "@/generated/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlueprintRule {
  subjectId?: string | null;
  questionGroupId?: string | null;
  difficulty?: string | null;
  count: number;
  points: number;
}

interface CreateBlueprintData {
  sectionId?: string;
  categoryId?: string | null;
  subjectId?: string | null;
  questionGroupId?: string | null;
  mode?: string;
  difficulty?: string | null;
  count?: number;
  points?: number;
}

interface UpdateBlueprintData {
  sectionId?: string | null;
  categoryId?: string | null;
  subjectId?: string | null;
  questionGroupId?: string | null;
  mode?: string;
  difficulty?: string | null;
  count?: number;
  points?: number;
}

// ---------------------------------------------------------------------------
// 1. listBlueprints — List blueprints for an exam
// ---------------------------------------------------------------------------

export async function listBlueprints(tenantId: string, examId: string) {
  // Verify exam belongs to tenant
  const exam = await prisma.exam.findFirst({
    where: { id: examId, tenantId },
    select: { id: true },
  });

  if (!exam) {
    throw errors.notFound("ไม่พบชุดสอบ");
  }

  return prisma.examBlueprint.findMany({
    where: { examId },
    include: {
      category: { select: { id: true, name: true } },
      subject: { select: { id: true, code: true, name: true } },
      questionGroup: { select: { id: true, name: true } },
      section: { select: { id: true, title: true } },
    },
    orderBy: { id: "asc" },
  });
}

// ---------------------------------------------------------------------------
// 2. createBlueprint — Create a new blueprint rule
// ---------------------------------------------------------------------------

export async function createBlueprint(
  tenantId: string,
  examId: string,
  data: CreateBlueprintData
) {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, tenantId },
    select: { id: true },
  });

  if (!exam) {
    throw errors.notFound("ไม่พบชุดสอบ");
  }

  return prisma.examBlueprint.create({
    data: {
      examId,
      sectionId: data.sectionId ?? null,
      categoryId: data.categoryId ?? null,
      subjectId: data.subjectId ?? null,
      questionGroupId: data.questionGroupId ?? null,
      mode: data.mode ?? "BLUEPRINT",
      difficulty: data.difficulty ?? null,
      count: data.count ?? 1,
      points: data.points ?? 1,
    },
    include: {
      category: { select: { id: true, name: true } },
      subject: { select: { id: true, code: true, name: true } },
      questionGroup: { select: { id: true, name: true } },
      section: { select: { id: true, title: true } },
    },
  });
}

// ---------------------------------------------------------------------------
// 3. updateBlueprint — Update a blueprint rule
// ---------------------------------------------------------------------------

export async function updateBlueprint(
  tenantId: string,
  blueprintId: string,
  data: UpdateBlueprintData
) {
  const blueprint = await prisma.examBlueprint.findFirst({
    where: {
      id: blueprintId,
      exam: { tenantId },
    },
  });

  if (!blueprint) {
    throw errors.notFound("ไม่พบ Blueprint");
  }

  const updatePayload: Prisma.ExamBlueprintUpdateInput = {};
  if (data.sectionId !== undefined) {
    updatePayload.section = data.sectionId
      ? { connect: { id: data.sectionId } }
      : { disconnect: true };
  }
  if (data.categoryId !== undefined) {
    updatePayload.category = data.categoryId
      ? { connect: { id: data.categoryId } }
      : { disconnect: true };
  }
  if (data.subjectId !== undefined) {
    updatePayload.subject = data.subjectId
      ? { connect: { id: data.subjectId } }
      : { disconnect: true };
  }
  if (data.questionGroupId !== undefined) {
    updatePayload.questionGroup = data.questionGroupId
      ? { connect: { id: data.questionGroupId } }
      : { disconnect: true };
  }
  if (data.mode !== undefined) updatePayload.mode = data.mode;
  if (data.difficulty !== undefined) updatePayload.difficulty = data.difficulty;
  if (data.count !== undefined) updatePayload.count = data.count;
  if (data.points !== undefined) updatePayload.points = data.points;

  return prisma.examBlueprint.update({
    where: { id: blueprintId },
    data: updatePayload,
    include: {
      category: { select: { id: true, name: true } },
      subject: { select: { id: true, code: true, name: true } },
      questionGroup: { select: { id: true, name: true } },
      section: { select: { id: true, title: true } },
    },
  });
}

// ---------------------------------------------------------------------------
// 4. deleteBlueprint — Delete a blueprint rule
// ---------------------------------------------------------------------------

export async function deleteBlueprint(tenantId: string, blueprintId: string) {
  const blueprint = await prisma.examBlueprint.findFirst({
    where: {
      id: blueprintId,
      exam: { tenantId },
    },
  });

  if (!blueprint) {
    throw errors.notFound("ไม่พบ Blueprint");
  }

  await prisma.examBlueprint.delete({
    where: { id: blueprintId },
  });
}

// ---------------------------------------------------------------------------
// 5. previewBlueprint — Check how many questions match criteria
// ---------------------------------------------------------------------------

export async function previewBlueprint(
  tenantId: string,
  rules: BlueprintRule[],
  excludeQuestionIds: string[] = []
) {
  const results = await Promise.all(
    rules.map(async (rule) => {
      const where: Prisma.QuestionWhereInput = {
        tenantId,
        status: "ACTIVE",
        isExamOnly: false,
        ...(rule.subjectId ? { subjectId: rule.subjectId } : {}),
        ...(rule.questionGroupId
          ? { questionGroupId: rule.questionGroupId }
          : {}),
        ...(rule.difficulty ? { difficulty: rule.difficulty } : {}),
        ...(excludeQuestionIds.length > 0
          ? { id: { notIn: excludeQuestionIds } }
          : {}),
      };

      const available = await prisma.question.count({ where });

      return {
        difficulty: rule.difficulty,
        count: rule.count,
        points: rule.points,
        available,
        sufficient: available >= rule.count,
      };
    })
  );

  return results;
}

// ---------------------------------------------------------------------------
// 6. generateFromBlueprints — Random pick questions and add to section
// ---------------------------------------------------------------------------

export async function generateFromBlueprints(
  tenantId: string,
  sectionId: string,
  rules: BlueprintRule[]
) {
  // Verify section belongs to tenant
  const section = await prisma.examSection.findFirst({
    where: {
      id: sectionId,
      exam: { tenantId },
    },
    include: {
      questions: { select: { questionId: true } },
    },
  });

  if (!section) {
    throw errors.notFound("ไม่พบส่วนของชุดสอบ");
  }

  // Collect existing question IDs to exclude
  const existingIds = section.questions.map((q) => q.questionId);
  const allPickedIds: string[] = [];

  for (const rule of rules) {
    const where: Prisma.QuestionWhereInput = {
      tenantId,
      status: "ACTIVE",
      isExamOnly: false,
      ...(rule.subjectId ? { subjectId: rule.subjectId } : {}),
      ...(rule.questionGroupId
        ? { questionGroupId: rule.questionGroupId }
        : {}),
      ...(rule.difficulty ? { difficulty: rule.difficulty } : {}),
      id: {
        notIn: [...existingIds, ...allPickedIds],
      },
    };

    // Fetch all matching question IDs
    const candidates = await prisma.question.findMany({
      where,
      select: { id: true },
    });

    // Shuffle and pick
    const shuffled = shuffleArray(candidates.map((c) => c.id));
    const picked = shuffled.slice(0, rule.count);
    allPickedIds.push(...picked);
  }

  if (allPickedIds.length === 0) {
    return { added: 0 };
  }

  // Use batch add with points from first rule (or null for default)
  const result = await addSectionQuestions(
    tenantId,
    sectionId,
    allPickedIds,
    null // Use question default points
  );

  return result;
}

// ---------------------------------------------------------------------------
// 7. simpleRandom — Simple random pick without difficulty breakdown
// ---------------------------------------------------------------------------

export async function simpleRandom(
  tenantId: string,
  sectionId: string,
  options: {
    subjectId?: string | null;
    questionGroupId?: string | null;
    count: number;
    points?: number;
  }
) {
  return generateFromBlueprints(tenantId, sectionId, [
    {
      subjectId: options.subjectId,
      questionGroupId: options.questionGroupId,
      difficulty: null,
      count: options.count,
      points: options.points ?? 1,
    },
  ]);
}

// ---------------------------------------------------------------------------
// Helper: Fisher-Yates shuffle
// ---------------------------------------------------------------------------

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
