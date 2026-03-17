import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type { PaginationMeta } from "@/types";
import type { Prisma } from "@/generated/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExamFilters {
  search?: string;
  status?: string;
  mode?: string;
  page?: number;
  perPage?: number;
}

interface ExamListResult {
  data: Array<Record<string, unknown>>;
  meta: PaginationMeta;
}

interface CreateExamData {
  title: string;
  description?: string | null;
  mode?: string;
  passingScore?: number;
  duration?: number;
  settings?: unknown;
}

interface UpdateExamData {
  title?: string;
  description?: string | null;
  status?: string;
  mode?: string;
  totalPoints?: number;
  passingScore?: number;
  duration?: number;
  settings?: unknown;
}

interface CreateSectionData {
  title: string;
  description?: string | null;
  sortOrder?: number;
}

interface UpdateSectionData {
  title?: string;
  description?: string | null;
  sortOrder?: number;
}

interface AddSectionQuestionData {
  questionId: string;
  sortOrder?: number;
  points?: number | null;
}

// ---------------------------------------------------------------------------
// Shared include for returning exam with full relations
// ---------------------------------------------------------------------------

const examWithRelations = {
  sections: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      _count: { select: { questions: true } },
    },
  },
  blueprints: {
    include: {
      category: { select: { id: true, name: true } },
      subject: { select: { id: true, code: true, name: true } },
      questionGroup: { select: { id: true, name: true } },
    },
  },
  schedules: {
    orderBy: { startDate: "asc" as const },
  },
  accesses: true,
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.ExamInclude;

// Extended include for exam builder — includes full question details per section
const examBuilderInclude = {
  sections: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      questions: {
        orderBy: { sortOrder: "asc" as const },
        include: {
          question: {
            include: {
              subject: { select: { id: true, code: true, name: true } },
              questionGroup: { select: { id: true, name: true, color: true } },
              questionTags: { include: { tag: true } },
            },
          },
        },
      },
      _count: { select: { questions: true } },
    },
  },
  blueprints: {
    include: {
      category: { select: { id: true, name: true } },
      subject: { select: { id: true, code: true, name: true } },
      questionGroup: { select: { id: true, name: true } },
      section: { select: { id: true, title: true } },
    },
  },
  schedules: {
    orderBy: { startDate: "asc" as const },
  },
  accesses: true,
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.ExamInclude;

// ---------------------------------------------------------------------------
// 1. listExams — Paginated list with filters
// ---------------------------------------------------------------------------

export async function listExams(
  tenantId: string,
  filters: ExamFilters = {}
): Promise<ExamListResult> {
  const page = filters.page ?? 1;
  const perPage = filters.perPage ?? 20;
  const skip = (page - 1) * perPage;

  const where: Prisma.ExamWhereInput = {
    tenantId,
    ...(filters.search
      ? {
          title: { contains: filters.search, mode: "insensitive" as const },
        }
      : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.mode ? { mode: filters.mode } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.exam.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { sections: true, schedules: true } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.exam.count({ where }),
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
// 2. getExam — Get single exam with all relations
// ---------------------------------------------------------------------------

export async function getExam(tenantId: string, examId: string) {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, tenantId },
    include: examWithRelations,
  });

  if (!exam) {
    throw errors.notFound("ไม่พบชุดสอบ");
  }

  return exam;
}

// ---------------------------------------------------------------------------
// 3. createExam — Create a new exam
// ---------------------------------------------------------------------------

export async function createExam(
  tenantId: string,
  userId: string,
  data: CreateExamData
) {
  const exam = await prisma.exam.create({
    data: {
      tenantId,
      createdById: userId,
      title: data.title,
      description: data.description ?? null,
      mode: data.mode ?? "PUBLIC",
      passingScore: data.passingScore ?? 50,
      duration: data.duration ?? 60,
      settings: data.settings as Prisma.InputJsonValue ?? undefined,
    },
  });

  return getExam(tenantId, exam.id);
}

// ---------------------------------------------------------------------------
// 4. updateExam — Update exam fields
// ---------------------------------------------------------------------------

export async function updateExam(
  tenantId: string,
  examId: string,
  data: UpdateExamData
) {
  const existing = await prisma.exam.findFirst({
    where: { id: examId, tenantId },
  });

  if (!existing) {
    throw errors.notFound("ไม่พบชุดสอบ");
  }

  // Build the update payload, only including provided fields
  const updatePayload: Prisma.ExamUpdateInput = {};
  if (data.title !== undefined) updatePayload.title = data.title;
  if (data.description !== undefined) updatePayload.description = data.description;
  if (data.status !== undefined) updatePayload.status = data.status;
  if (data.mode !== undefined) updatePayload.mode = data.mode;
  if (data.totalPoints !== undefined) updatePayload.totalPoints = data.totalPoints;
  if (data.passingScore !== undefined) updatePayload.passingScore = data.passingScore;
  if (data.duration !== undefined) updatePayload.duration = data.duration;
  if (data.settings !== undefined) updatePayload.settings = data.settings as Prisma.InputJsonValue;

  await prisma.exam.update({
    where: { id: examId },
    data: updatePayload,
  });

  return getExam(tenantId, examId);
}

// ---------------------------------------------------------------------------
// 5. deleteExam — Delete exam (only DRAFT status allowed)
// ---------------------------------------------------------------------------

export async function deleteExam(tenantId: string, examId: string) {
  const existing = await prisma.exam.findFirst({
    where: { id: examId, tenantId },
  });

  if (!existing) {
    throw errors.notFound("ไม่พบชุดสอบ");
  }

  if (existing.status !== "DRAFT") {
    throw errors.forbidden("สามารถลบได้เฉพาะชุดสอบที่เป็น DRAFT เท่านั้น");
  }

  await prisma.exam.delete({
    where: { id: examId },
  });
}

// ---------------------------------------------------------------------------
// 6. cloneExam — Deep clone exam with sections and section questions
// ---------------------------------------------------------------------------

export async function cloneExam(
  tenantId: string,
  userId: string,
  examId: string
) {
  const existing = await prisma.exam.findFirst({
    where: { id: examId, tenantId },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          questions: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!existing) {
    throw errors.notFound("ไม่พบชุดสอบ");
  }

  const clonedExam = await prisma.$transaction(async (tx) => {
    // Create the cloned exam
    const newExam = await tx.exam.create({
      data: {
        tenantId,
        createdById: userId,
        title: `${existing.title} (สำเนา)`,
        description: existing.description,
        status: "DRAFT",
        mode: existing.mode,
        totalPoints: existing.totalPoints,
        passingScore: existing.passingScore,
        duration: existing.duration,
        settings: existing.settings as Prisma.InputJsonValue ?? undefined,
      },
    });

    // Clone sections and their questions
    for (const section of existing.sections) {
      const newSection = await tx.examSection.create({
        data: {
          examId: newExam.id,
          title: section.title,
          description: section.description,
          sortOrder: section.sortOrder,
        },
      });

      // Clone section questions
      if (section.questions.length > 0) {
        await tx.examSectionQuestion.createMany({
          data: section.questions.map((sq) => ({
            sectionId: newSection.id,
            questionId: sq.questionId,
            sortOrder: sq.sortOrder,
            points: sq.points,
          })),
        });
      }
    }

    return newExam;
  });

  return getExam(tenantId, clonedExam.id);
}

// ---------------------------------------------------------------------------
// 7. addSection — Add a section to an exam
// ---------------------------------------------------------------------------

export async function addSection(
  tenantId: string,
  examId: string,
  data: CreateSectionData
) {
  // Verify exam belongs to tenant
  const exam = await prisma.exam.findFirst({
    where: { id: examId, tenantId },
  });

  if (!exam) {
    throw errors.notFound("ไม่พบชุดสอบ");
  }

  const section = await prisma.examSection.create({
    data: {
      examId,
      title: data.title,
      description: data.description ?? null,
      sortOrder: data.sortOrder ?? 0,
    },
  });

  return section;
}

// ---------------------------------------------------------------------------
// 8. updateSection — Update a section
// ---------------------------------------------------------------------------

export async function updateSection(
  tenantId: string,
  sectionId: string,
  data: UpdateSectionData
) {
  // Verify section belongs to tenant via exam
  const section = await prisma.examSection.findFirst({
    where: {
      id: sectionId,
      exam: { tenantId },
    },
  });

  if (!section) {
    throw errors.notFound("ไม่พบส่วนของชุดสอบ");
  }

  // Build the update payload, only including provided fields
  const updatePayload: Prisma.ExamSectionUpdateInput = {};
  if (data.title !== undefined) updatePayload.title = data.title;
  if (data.description !== undefined) updatePayload.description = data.description;
  if (data.sortOrder !== undefined) updatePayload.sortOrder = data.sortOrder;

  const updated = await prisma.examSection.update({
    where: { id: sectionId },
    data: updatePayload,
  });

  return updated;
}

// ---------------------------------------------------------------------------
// 9. deleteSection — Delete a section
// ---------------------------------------------------------------------------

export async function deleteSection(tenantId: string, sectionId: string) {
  // Verify section belongs to tenant via exam
  const section = await prisma.examSection.findFirst({
    where: {
      id: sectionId,
      exam: { tenantId },
    },
  });

  if (!section) {
    throw errors.notFound("ไม่พบส่วนของชุดสอบ");
  }

  await prisma.examSection.delete({
    where: { id: sectionId },
  });
}

// ---------------------------------------------------------------------------
// 10. addSectionQuestion — Add a question to a section
// ---------------------------------------------------------------------------

export async function addSectionQuestion(
  tenantId: string,
  sectionId: string,
  data: AddSectionQuestionData
) {
  // Verify section belongs to tenant via exam
  const section = await prisma.examSection.findFirst({
    where: {
      id: sectionId,
      exam: { tenantId },
    },
    include: {
      exam: { select: { id: true } },
    },
  });

  if (!section) {
    throw errors.notFound("ไม่พบส่วนของชุดสอบ");
  }

  // Verify question belongs to the same tenant
  const question = await prisma.question.findFirst({
    where: { id: data.questionId, tenantId },
  });

  if (!question) {
    throw errors.notFound("ไม่พบข้อสอบ");
  }

  const sectionQuestion = await prisma.examSectionQuestion.create({
    data: {
      sectionId,
      questionId: data.questionId,
      sortOrder: data.sortOrder ?? 0,
      points: data.points ?? null,
    },
  });

  // Recalculate total points for the exam
  await recalculateTotalPoints(section.exam.id);

  return sectionQuestion;
}

// ---------------------------------------------------------------------------
// 11. removeSectionQuestion — Remove a question from a section
// ---------------------------------------------------------------------------

export async function removeSectionQuestion(
  tenantId: string,
  questionLinkId: string
) {
  // Verify the section question link belongs to tenant via section → exam
  const sectionQuestion = await prisma.examSectionQuestion.findFirst({
    where: {
      id: questionLinkId,
      section: {
        exam: { tenantId },
      },
    },
    include: {
      section: {
        select: { examId: true },
      },
    },
  });

  if (!sectionQuestion) {
    throw errors.notFound("ไม่พบการเชื่อมโยงข้อสอบ");
  }

  const examId = sectionQuestion.section.examId;

  await prisma.examSectionQuestion.delete({
    where: { id: questionLinkId },
  });

  // Recalculate total points for the exam
  await recalculateTotalPoints(examId);
}

// ---------------------------------------------------------------------------
// 12. getExamForBuilder — Get exam with full question details for builder UI
// ---------------------------------------------------------------------------

export async function getExamForBuilder(tenantId: string, examId: string) {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, tenantId },
    include: examBuilderInclude,
  });

  if (!exam) {
    throw errors.notFound("ไม่พบชุดสอบ");
  }

  return exam;
}

// ---------------------------------------------------------------------------
// 13. addSectionQuestions — Batch add multiple questions to a section
// ---------------------------------------------------------------------------

export async function addSectionQuestions(
  tenantId: string,
  sectionId: string,
  questionIds: string[],
  pointsOverride?: number | null
) {
  // Verify section belongs to tenant via exam
  const section = await prisma.examSection.findFirst({
    where: {
      id: sectionId,
      exam: { tenantId },
    },
    include: {
      exam: { select: { id: true } },
      questions: { select: { questionId: true, sortOrder: true } },
    },
  });

  if (!section) {
    throw errors.notFound("ไม่พบส่วนของชุดสอบ");
  }

  // Filter out questions already in this section
  const existingQuestionIds = new Set(
    section.questions.map((q) => q.questionId)
  );
  const newQuestionIds = questionIds.filter(
    (id) => !existingQuestionIds.has(id)
  );

  if (newQuestionIds.length === 0) {
    return { added: 0 };
  }

  // Verify all questions belong to the same tenant
  const questions = await prisma.question.findMany({
    where: { id: { in: newQuestionIds }, tenantId },
    select: { id: true },
  });

  const validIds = new Set(questions.map((q) => q.id));
  const validNewIds = newQuestionIds.filter((id) => validIds.has(id));

  if (validNewIds.length === 0) {
    return { added: 0 };
  }

  // Determine starting sortOrder
  const maxSortOrder = section.questions.reduce(
    (max, q) => Math.max(max, q.sortOrder),
    -1
  );

  await prisma.$transaction(async (tx) => {
    await tx.examSectionQuestion.createMany({
      data: validNewIds.map((questionId, index) => ({
        sectionId,
        questionId,
        sortOrder: maxSortOrder + 1 + index,
        points: pointsOverride ?? null,
      })),
    });
  });

  // Recalculate total points
  await recalculateTotalPoints(section.exam.id);

  return { added: validNewIds.length };
}

// ---------------------------------------------------------------------------
// 14. reorderSections — Reorder sections within an exam
// ---------------------------------------------------------------------------

export async function reorderSections(
  tenantId: string,
  examId: string,
  sectionIds: string[]
) {
  // Verify exam belongs to tenant
  const exam = await prisma.exam.findFirst({
    where: { id: examId, tenantId },
    include: {
      sections: { select: { id: true } },
    },
  });

  if (!exam) {
    throw errors.notFound("ไม่พบชุดสอบ");
  }

  // Verify all provided sectionIds belong to this exam
  const examSectionIds = new Set(exam.sections.map((s) => s.id));
  for (const sId of sectionIds) {
    if (!examSectionIds.has(sId)) {
      throw errors.validation("Section ไม่ได้อยู่ในชุดสอบนี้");
    }
  }

  // Update sortOrder for each section
  await prisma.$transaction(
    sectionIds.map((id, index) =>
      prisma.examSection.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );
}

// ---------------------------------------------------------------------------
// 15. reorderSectionQuestions — Reorder questions within a section
// ---------------------------------------------------------------------------

export async function reorderSectionQuestions(
  tenantId: string,
  sectionId: string,
  questionLinkIds: string[]
) {
  // Verify section belongs to tenant via exam
  const section = await prisma.examSection.findFirst({
    where: {
      id: sectionId,
      exam: { tenantId },
    },
    include: {
      questions: { select: { id: true } },
    },
  });

  if (!section) {
    throw errors.notFound("ไม่พบส่วนของชุดสอบ");
  }

  // Verify all provided questionLinkIds belong to this section
  const sectionQuestionIds = new Set(section.questions.map((q) => q.id));
  for (const qId of questionLinkIds) {
    if (!sectionQuestionIds.has(qId)) {
      throw errors.validation("ข้อสอบไม่ได้อยู่ในส่วนนี้");
    }
  }

  // Update sortOrder for each question link
  await prisma.$transaction(
    questionLinkIds.map((id, index) =>
      prisma.examSectionQuestion.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );
}

// ---------------------------------------------------------------------------
// 16. recalculateTotalPoints — Recalculate exam total points from sections
// ---------------------------------------------------------------------------

export async function recalculateTotalPoints(examId: string) {
  const sectionQuestions = await prisma.examSectionQuestion.findMany({
    where: {
      section: { examId },
    },
    include: {
      question: { select: { points: true } },
    },
  });

  // Use override points if set, otherwise fall back to question default points
  const totalPoints = sectionQuestions.reduce((sum, sq) => {
    const points = sq.points ?? sq.question.points;
    return sum + points;
  }, 0);

  await prisma.exam.update({
    where: { id: examId },
    data: { totalPoints },
  });

  return totalPoints;
}
