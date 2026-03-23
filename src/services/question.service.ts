import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { extractPlainText } from "@/lib/content-utils";
import type { PaginationMeta } from "@/types";
import type { Prisma } from "@/generated/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuestionFilters {
  page?: number;
  perPage?: number;
  search?: string;
  type?: string;
  difficulty?: string;
  status?: string;
  subjectId?: string;
  questionGroupId?: string;
  tagId?: string;
  includeExamOnly?: boolean; // default false — set true for exam builder context
}

interface QuestionListResult {
  data: Array<Record<string, unknown>>;
  meta: PaginationMeta;
}

interface MediaAttachment {
  mediaFileId: string;
  caption?: string | null;
  sortOrder?: number;
}

interface CreateQuestionData {
  type: string;
  difficulty?: string;
  content: unknown;
  options?: unknown;
  correctAnswer?: unknown;
  explanation?: string | null;
  points?: number;
  status?: string;
  subjectId?: string | null;
  questionGroupId?: string | null;
  tagIds?: string[];
  metadata?: unknown;
  media?: MediaAttachment[];
  isExamOnly?: boolean;
  examId?: string | null;
}

interface UpdateQuestionData {
  type?: string;
  difficulty?: string;
  content?: unknown;
  options?: unknown;
  correctAnswer?: unknown;
  explanation?: string | null;
  points?: number;
  status?: string;
  subjectId?: string | null;
  questionGroupId?: string | null;
  tagIds?: string[];
  metadata?: unknown;
  media?: MediaAttachment[];
}

// ---------------------------------------------------------------------------
// Shared include for returning question with full relations
// ---------------------------------------------------------------------------

const questionWithRelations = {
  subject: { select: { id: true, code: true, name: true } },
  questionGroup: { select: { id: true, name: true, color: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  questionTags: {
    include: { tag: true },
  },
  media: {
    include: { mediaFile: true },
    orderBy: { sortOrder: "asc" as const },
  },
} satisfies Prisma.QuestionInclude;

const questionWithAllRelations = {
  ...questionWithRelations,
  histories: {
    take: 10,
    orderBy: { createdAt: "desc" as const },
    include: {
      changedBy: { select: { id: true, name: true, email: true } },
    },
  },
} satisfies Prisma.QuestionInclude;

// ---------------------------------------------------------------------------
// 1. listQuestions — Paginated list with filters
// ---------------------------------------------------------------------------

export async function listQuestions(
  tenantId: string,
  filters: QuestionFilters = {}
): Promise<QuestionListResult> {
  const page = filters.page ?? 1;
  const perPage = filters.perPage ?? 20;
  const skip = (page - 1) * perPage;

  const where: Prisma.QuestionWhereInput = {
    tenantId,
    // Exclude exam-only questions from normal listing (unless explicitly requested)
    ...(filters.includeExamOnly ? {} : { isExamOnly: false }),
    ...(filters.search
      ? {
          searchText: {
            contains: filters.search,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
    ...(filters.questionGroupId ? { questionGroupId: filters.questionGroupId } : {}),
    ...(filters.tagId
      ? {
          questionTags: {
            some: { tagId: filters.tagId },
          },
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.question.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: "desc" },
      include: {
        subject: { select: { id: true, code: true, name: true } },
        questionGroup: { select: { id: true, name: true, color: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        questionTags: {
          include: { tag: true },
        },
      },
    }),
    prisma.question.count({ where }),
  ]);

  return {
    data: data as unknown as Array<Record<string, unknown>>,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

// ---------------------------------------------------------------------------
// 2. getQuestion — Get single question with all relations
// ---------------------------------------------------------------------------

export async function getQuestion(tenantId: string, id: string) {
  const question = await prisma.question.findFirst({
    where: { id, tenantId },
    include: questionWithAllRelations,
  });

  if (!question) {
    throw errors.notFound("ไม่พบข้อสอบ");
  }

  return question;
}

// ---------------------------------------------------------------------------
// 3. createQuestion — Create question + tags + history
// ---------------------------------------------------------------------------

export async function createQuestion(
  tenantId: string,
  createdById: string,
  data: CreateQuestionData
) {
  const { tagIds, media, ...questionData } = data;

  const question = await prisma.$transaction(async (tx) => {
    const created = await tx.question.create({
      data: {
        tenantId,
        createdById,
        type: questionData.type,
        difficulty: questionData.difficulty ?? "MEDIUM",
        content: questionData.content as Prisma.InputJsonValue,
        searchText: extractPlainText(questionData.content),
        options: questionData.options as Prisma.InputJsonValue ?? undefined,
        correctAnswer: questionData.correctAnswer as Prisma.InputJsonValue ?? undefined,
        explanation: questionData.explanation,
        points: questionData.points ?? 1,
        status: questionData.status ?? "DRAFT",
        subjectId: questionData.subjectId,
        questionGroupId: questionData.questionGroupId,
        metadata: questionData.metadata as Prisma.InputJsonValue ?? undefined,
        isExamOnly: questionData.isExamOnly ?? false,
        examId: questionData.examId ?? null,
      },
    });

    // Create tag associations
    if (tagIds && tagIds.length > 0) {
      await tx.questionTag.createMany({
        data: tagIds.map((tagId) => ({
          questionId: created.id,
          tagId,
        })),
      });
    }

    // Create media attachments
    if (media && media.length > 0) {
      await tx.questionMedia.createMany({
        data: media.map((m) => ({
          questionId: created.id,
          mediaFileId: m.mediaFileId,
          caption: m.caption ?? null,
          sortOrder: m.sortOrder ?? 0,
        })),
      });
    }

    // Create history record
    await tx.questionHistory.create({
      data: {
        questionId: created.id,
        changedById: createdById,
        changeType: "CREATED",
      },
    });

    return created;
  });

  return getQuestion(tenantId, question.id);
}

// ---------------------------------------------------------------------------
// 4. updateQuestion — Update question + tags + history
// ---------------------------------------------------------------------------

export async function updateQuestion(
  tenantId: string,
  id: string,
  changedById: string,
  data: UpdateQuestionData
) {
  const existing = await prisma.question.findFirst({
    where: { id, tenantId },
    include: { questionTags: true },
  });

  if (!existing) {
    throw errors.notFound("ไม่พบข้อสอบ");
  }

  const { tagIds, media, ...updateData } = data;

  // Build the update payload, only including provided fields
  const updatePayload: Prisma.QuestionUpdateInput = {};
  if (updateData.type !== undefined) updatePayload.type = updateData.type;
  if (updateData.difficulty !== undefined) updatePayload.difficulty = updateData.difficulty;
  if (updateData.content !== undefined) {
    updatePayload.content = updateData.content as Prisma.InputJsonValue;
    updatePayload.searchText = extractPlainText(updateData.content);
  }
  if (updateData.options !== undefined) updatePayload.options = updateData.options as Prisma.InputJsonValue;
  if (updateData.correctAnswer !== undefined) updatePayload.correctAnswer = updateData.correctAnswer as Prisma.InputJsonValue;
  if (updateData.explanation !== undefined) updatePayload.explanation = updateData.explanation;
  if (updateData.points !== undefined) updatePayload.points = updateData.points;
  if (updateData.status !== undefined) updatePayload.status = updateData.status;
  if (updateData.subjectId !== undefined) {
    updatePayload.subject = updateData.subjectId
      ? { connect: { id: updateData.subjectId } }
      : { disconnect: true };
  }
  if (updateData.questionGroupId !== undefined) {
    updatePayload.questionGroup = updateData.questionGroupId
      ? { connect: { id: updateData.questionGroupId } }
      : { disconnect: true };
  }
  if (updateData.metadata !== undefined) updatePayload.metadata = updateData.metadata as Prisma.InputJsonValue;

  // Save previous data for audit trail
  const previousData = {
    type: existing.type,
    difficulty: existing.difficulty,
    content: existing.content,
    options: existing.options,
    correctAnswer: existing.correctAnswer,
    explanation: existing.explanation,
    points: existing.points,
    status: existing.status,
    metadata: existing.metadata,
    tagIds: existing.questionTags.map((qt) => qt.tagId),
  };

  await prisma.$transaction(async (tx) => {
    // Update question fields
    await tx.question.update({
      where: { id },
      data: updatePayload,
    });

    // Replace tags if tagIds provided
    if (tagIds !== undefined) {
      await tx.questionTag.deleteMany({
        where: { questionId: id },
      });

      if (tagIds.length > 0) {
        await tx.questionTag.createMany({
          data: tagIds.map((tagId) => ({
            questionId: id,
            tagId,
          })),
        });
      }
    }

    // Replace media attachments if media provided
    if (media !== undefined) {
      await tx.questionMedia.deleteMany({
        where: { questionId: id },
      });

      if (media.length > 0) {
        await tx.questionMedia.createMany({
          data: media.map((m) => ({
            questionId: id,
            mediaFileId: m.mediaFileId,
            caption: m.caption ?? null,
            sortOrder: m.sortOrder ?? 0,
          })),
        });
      }
    }

    // Create history record
    await tx.questionHistory.create({
      data: {
        questionId: id,
        changedById,
        changeType: "UPDATED",
        previousData: previousData as unknown as Prisma.InputJsonValue,
      },
    });
  });

  return getQuestion(tenantId, id);
}

// ---------------------------------------------------------------------------
// 5. deleteQuestion — Soft delete (set status to ARCHIVED)
// ---------------------------------------------------------------------------

export async function deleteQuestion(
  tenantId: string,
  id: string,
  changedById: string
) {
  const existing = await prisma.question.findFirst({
    where: { id, tenantId },
  });

  if (!existing) {
    throw errors.notFound("ไม่พบข้อสอบ");
  }

  await prisma.$transaction([
    prisma.question.update({
      where: { id },
      data: { status: "ARCHIVED" },
    }),
    prisma.questionHistory.create({
      data: {
        questionId: id,
        changedById,
        changeType: "ARCHIVED",
        previousData: { status: existing.status } as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);
}

// ---------------------------------------------------------------------------
// 6. Bulk Operations
// ---------------------------------------------------------------------------

export async function bulkUpdateQuestions(
  tenantId: string,
  questionIds: string[],
  data: { status?: string; questionGroupId?: string | null },
  changedById: string
) {
  if (questionIds.length === 0) return { updated: 0 };

  // Verify all questions belong to tenant
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds }, tenantId },
    select: { id: true, status: true },
  });

  const validIds = questions.map((q) => q.id);
  if (validIds.length === 0) throw errors.notFound("ไม่พบข้อสอบที่เลือก");

  const updateData: Record<string, unknown> = {};
  if (data.status) updateData.status = data.status;
  if (data.questionGroupId !== undefined) updateData.questionGroupId = data.questionGroupId || null;

  await prisma.$transaction([
    prisma.question.updateMany({
      where: { id: { in: validIds } },
      data: updateData,
    }),
    // Create history for each
    ...validIds.map((qid) =>
      prisma.questionHistory.create({
        data: {
          questionId: qid,
          changedById,
          changeType: data.status === "ARCHIVED" ? "ARCHIVED" : "UPDATED",
          previousData: { bulkAction: true, ...data } as unknown as Prisma.InputJsonValue,
        },
      })
    ),
  ]);

  return { updated: validIds.length };
}

