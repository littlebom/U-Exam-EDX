import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type { PaginationMeta } from "@/types";
import type { Prisma } from "@/generated/prisma";
import type {
  GradeAnswerInput,
  BatchGradeInput,
  AdjustScoreInput,
  GradeFilter,
  GradingQueueFilter,
  CreateRubricInput,
  UpdateRubricInput,
  RubricFilter,
} from "@/lib/validations/grading";

// ─── Shared Includes ────────────────────────────────────────────────

const gradeInclude = {
  session: {
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      examSchedule: {
        include: {
          exam: { select: { id: true, title: true, passingScore: true, totalPoints: true } },
        },
      },
    },
  },
  gradeAnswers: {
    include: {
      answer: {
        include: {
          question: {
            select: { id: true, type: true, content: true, options: true, correctAnswer: true, points: true },
          },
        },
      },
      gradedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.GradeInclude;

const gradeListInclude = {
  session: {
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      examSchedule: {
        include: {
          exam: { select: { id: true, title: true } },
        },
      },
    },
  },
} satisfies Prisma.GradeInclude;

// ─── List Grades ────────────────────────────────────────────────────

export async function listGrades(
  tenantId: string,
  filters: GradeFilter
): Promise<{ data: unknown[]; meta: PaginationMeta }> {
  const { examId, status, isPassed, search, page, perPage } = filters;

  const where: Prisma.GradeWhereInput = {
    tenantId,
    ...(status && { status }),
    ...(isPassed !== undefined && { isPassed }),
    ...(examId && {
      session: { examSchedule: { examId } },
    }),
    ...(search && {
      session: {
        candidate: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
        ...(examId && { examSchedule: { examId } }),
      },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.grade.findMany({
      where,
      include: gradeListInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.grade.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

// ─── Get Grade Detail ───────────────────────────────────────────────

export async function getGrade(tenantId: string, gradeId: string) {
  const grade = await prisma.grade.findUnique({
    where: { id: gradeId },
    include: gradeInclude,
  });

  if (!grade) throw errors.notFound("ไม่พบข้อมูลคะแนน");
  if (grade.tenantId !== tenantId) throw errors.forbidden();

  return grade;
}

// ─── Get Grade by Session ───────────────────────────────────────────

export async function getGradeBySession(tenantId: string, sessionId: string) {
  const grade = await prisma.grade.findUnique({
    where: { sessionId },
    include: gradeInclude,
  });

  if (!grade) throw errors.notFound("ไม่พบข้อมูลคะแนนสำหรับ Session นี้");
  if (grade.tenantId !== tenantId) throw errors.forbidden();

  return grade;
}

// ─── Grading Queue (manual grading items) ───────────────────────────

export async function getGradingQueue(
  tenantId: string,
  filters: GradingQueueFilter
): Promise<{ data: unknown[]; meta: PaginationMeta }> {
  const { examId, questionType, status, search, page, perPage } = filters;

  // Build where conditions for GradeAnswer
  const where: Prisma.GradeAnswerWhereInput = {
    grade: {
      tenantId,
      status: { in: ["GRADING", "DRAFT"] },
      ...(examId && {
        session: { examSchedule: { examId } },
      }),
      ...(search && {
        session: {
          candidate: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      }),
    },
    isAutoGraded: false, // Only manual grading items
    ...(questionType && {
      answer: { question: { type: questionType } },
    }),
    ...(status === "pending" && { score: 0, feedback: null }),
    ...(status === "graded" && { feedback: { not: null } }),
  };

  const [data, total] = await Promise.all([
    prisma.gradeAnswer.findMany({
      where,
      include: {
        grade: {
          include: {
            session: {
              include: {
                candidate: { select: { id: true, name: true, email: true } },
                examSchedule: {
                  include: {
                    exam: { select: { id: true, title: true } },
                  },
                },
              },
            },
          },
        },
        answer: {
          include: {
            question: {
              select: {
                id: true,
                type: true,
                content: true,
                options: true,
                correctAnswer: true,
                points: true,
              },
            },
          },
        },
        gradedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.gradeAnswer.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

// ─── Grade Single Answer (manual) ───────────────────────────────────

export async function gradeAnswer(
  tenantId: string,
  gradeId: string,
  graderId: string,
  input: GradeAnswerInput
) {
  const grade = await prisma.grade.findUnique({
    where: { id: gradeId },
    select: { id: true, tenantId: true, status: true },
  });

  if (!grade) throw errors.notFound("ไม่พบข้อมูลคะแนน");
  if (grade.tenantId !== tenantId) throw errors.forbidden();
  if (grade.status === "PUBLISHED") throw errors.validation("ไม่สามารถแก้ไขคะแนนที่เผยแพร่แล้ว");

  const gradeAnswer = await prisma.gradeAnswer.findUnique({
    where: { answerId: input.answerId },
  });

  if (!gradeAnswer || gradeAnswer.gradeId !== gradeId) {
    throw errors.notFound("ไม่พบข้อมูลคำตอบ");
  }

  // Clamp score to maxScore
  const score = Math.min(input.score, gradeAnswer.maxScore);

  return prisma.gradeAnswer.update({
    where: { id: gradeAnswer.id },
    data: {
      score,
      feedback: input.feedback,
      gradedById: graderId,
      isAutoGraded: false,
      isCorrect: score >= gradeAnswer.maxScore,
      rubricScores: input.rubricScores
        ? (input.rubricScores as unknown as Prisma.InputJsonValue)
        : undefined,
      ...(input.gradingDurationMs !== undefined && {
        gradingDurationMs: input.gradingDurationMs,
      }),
    },
  });
}

// ─── Batch Grade (multiple answers) ─────────────────────────────────

export async function batchGrade(
  tenantId: string,
  gradeId: string,
  graderId: string,
  input: BatchGradeInput
) {
  const grade = await prisma.grade.findUnique({
    where: { id: gradeId },
    select: { id: true, tenantId: true, status: true },
  });

  if (!grade) throw errors.notFound("ไม่พบข้อมูลคะแนน");
  if (grade.tenantId !== tenantId) throw errors.forbidden();
  if (grade.status === "PUBLISHED") throw errors.validation("ไม่สามารถแก้ไขคะแนนที่เผยแพร่แล้ว");

  return prisma.$transaction(async (tx) => {
    for (const answer of input.answers) {
      const ga = await tx.gradeAnswer.findUnique({
        where: { answerId: answer.answerId },
      });

      if (!ga || ga.gradeId !== gradeId) continue;

      const score = Math.min(answer.score, ga.maxScore);

      await tx.gradeAnswer.update({
        where: { id: ga.id },
        data: {
          score,
          feedback: answer.feedback,
          gradedById: graderId,
          isAutoGraded: false,
          isCorrect: score >= ga.maxScore,
          rubricScores: answer.rubricScores
            ? (answer.rubricScores as unknown as Prisma.InputJsonValue)
            : undefined,
        },
      });
    }

    // Recalculate grade totals
    return recalculateGrade(tx, gradeId);
  });
}

// ─── Recalculate Grade Totals ───────────────────────────────────────

async function recalculateGrade(
  tx: Prisma.TransactionClient,
  gradeId: string
) {
  const gradeAnswers = await tx.gradeAnswer.findMany({
    where: { gradeId },
  });

  const totalScore = gradeAnswers.reduce((sum, ga) => sum + ga.score, 0);
  const maxScore = gradeAnswers.reduce((sum, ga) => sum + ga.maxScore, 0);
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  // Check if all manual items are graded
  const ungradedManual = gradeAnswers.filter(
    (ga) => !ga.isAutoGraded && ga.feedback === null && ga.score === 0
  );

  const grade = await tx.grade.findUnique({
    where: { id: gradeId },
    include: {
      session: {
        include: {
          examSchedule: {
            include: { exam: { select: { passingScore: true } } },
          },
        },
      },
    },
  });

  const passingScore = grade?.session.examSchedule.exam.passingScore ?? 0;
  const isPassed = percentage >= passingScore;
  const isFullyGraded = ungradedManual.length === 0;

  return tx.grade.update({
    where: { id: gradeId },
    data: {
      totalScore: Math.round(totalScore * 100) / 100,
      maxScore,
      percentage: Math.round(percentage * 100) / 100,
      isPassed,
      status: isFullyGraded ? "COMPLETED" : "GRADING",
      gradedAt: isFullyGraded ? new Date() : null,
    },
    include: gradeListInclude,
  });
}

// ─── Adjust Score (post-grading) ────────────────────────────────────

export async function adjustScore(
  tenantId: string,
  gradeId: string,
  adjustedBy: string,
  input: AdjustScoreInput
) {
  const grade = await prisma.grade.findUnique({
    where: { id: gradeId },
    select: { id: true, tenantId: true, status: true, adjustments: true },
  });

  if (!grade) throw errors.notFound("ไม่พบข้อมูลคะแนน");
  if (grade.tenantId !== tenantId) throw errors.forbidden();

  const gradeAns = await prisma.gradeAnswer.findUnique({
    where: { answerId: input.answerId },
  });

  if (!gradeAns || gradeAns.gradeId !== gradeId) {
    throw errors.notFound("ไม่พบข้อมูลคำตอบ");
  }

  const newScore = Math.min(input.newScore, gradeAns.maxScore);

  return prisma.$transaction(async (tx) => {
    // Record adjustment
    const existingAdj = (grade.adjustments as unknown as Array<Record<string, unknown>>) ?? [];
    const adjustments = [
      ...existingAdj,
      {
        answerId: input.answerId,
        previousScore: gradeAns.score,
        newScore,
        reason: input.reason,
        adjustedBy,
        adjustedAt: new Date().toISOString(),
      },
    ];

    await tx.grade.update({
      where: { id: gradeId },
      data: { adjustments: adjustments as unknown as Prisma.InputJsonValue },
    });

    await tx.gradeAnswer.update({
      where: { id: gradeAns.id },
      data: { score: newScore },
    });

    return recalculateGrade(tx, gradeId);
  });
}

// ─── Publish Grade ──────────────────────────────────────────────────

export async function publishGrade(tenantId: string, gradeId: string) {
  const grade = await prisma.grade.findUnique({
    where: { id: gradeId },
    select: { id: true, tenantId: true, status: true },
  });

  if (!grade) throw errors.notFound("ไม่พบข้อมูลคะแนน");
  if (grade.tenantId !== tenantId) throw errors.forbidden();
  if (grade.status !== "COMPLETED") {
    throw errors.validation("ตรวจให้คะแนนยังไม่ครบ ไม่สามารถเผยแพร่ได้");
  }

  return prisma.grade.update({
    where: { id: gradeId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
    include: gradeListInclude,
  });
}

// ─── Publish Multiple Grades ────────────────────────────────────────

export async function bulkPublishGrades(tenantId: string, gradeIds: string[]) {
  return prisma.grade.updateMany({
    where: {
      id: { in: gradeIds },
      tenantId,
      status: "COMPLETED",
    },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });
}

// ─── Grading Stats ──────────────────────────────────────────────────

export async function getGradingStats(tenantId: string) {
  const [pending, grading, completed, published, totalAppeals, pendingAppeals] =
    await Promise.all([
      prisma.grade.count({ where: { tenantId, status: "DRAFT" } }),
      prisma.grade.count({ where: { tenantId, status: "GRADING" } }),
      prisma.grade.count({ where: { tenantId, status: "COMPLETED" } }),
      prisma.grade.count({ where: { tenantId, status: "PUBLISHED" } }),
      prisma.appeal.count({ where: { tenantId } }),
      prisma.appeal.count({ where: { tenantId, status: "PENDING" } }),
    ]);

  // Count manual grading queue items
  const manualPending = await prisma.gradeAnswer.count({
    where: {
      grade: { tenantId, status: { in: ["GRADING", "DRAFT"] } },
      isAutoGraded: false,
      feedback: null,
      score: 0,
    },
  });

  const manualGraded = await prisma.gradeAnswer.count({
    where: {
      grade: { tenantId },
      isAutoGraded: false,
      feedback: { not: null },
    },
  });

  return {
    grades: { pending, grading, completed, published },
    queue: { pending: manualPending, graded: manualGraded },
    appeals: { total: totalAppeals, pending: pendingAppeals },
  };
}

// ═══════════════════════════════════════════════════════════════════
// Rubric CRUD
// ═══════════════════════════════════════════════════════════════════

// ─── List Rubrics ───────────────────────────────────────────────────

export async function listRubrics(
  tenantId: string,
  filters: RubricFilter
): Promise<{ data: unknown[]; meta: PaginationMeta }> {
  const { examId, isActive, page, perPage } = filters;

  const where: Prisma.RubricWhereInput = {
    tenantId,
    ...(examId && { examId }),
    ...(isActive !== undefined && { isActive }),
  };

  const [data, total] = await Promise.all([
    prisma.rubric.findMany({
      where,
      include: {
        criteria: { orderBy: { sortOrder: "asc" } },
        exam: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.rubric.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

// ─── Get Rubric ─────────────────────────────────────────────────────

export async function getRubric(tenantId: string, rubricId: string) {
  const rubric = await prisma.rubric.findUnique({
    where: { id: rubricId },
    include: {
      criteria: { orderBy: { sortOrder: "asc" } },
      exam: { select: { id: true, title: true } },
    },
  });

  if (!rubric) throw errors.notFound("ไม่พบ Rubric");
  if (rubric.tenantId !== tenantId) throw errors.forbidden();

  return rubric;
}

// ─── Create Rubric ──────────────────────────────────────────────────

export async function createRubric(tenantId: string, input: CreateRubricInput) {
  return prisma.rubric.create({
    data: {
      tenantId,
      examId: input.examId,
      title: input.title,
      description: input.description,
      criteria: {
        create: input.criteria.map((c, i) => ({
          name: c.name,
          description: c.description,
          maxScore: c.maxScore,
          sortOrder: c.sortOrder ?? i,
        })),
      },
    },
    include: {
      criteria: { orderBy: { sortOrder: "asc" } },
    },
  });
}

// ─── Update Rubric ──────────────────────────────────────────────────

export async function updateRubric(
  tenantId: string,
  rubricId: string,
  input: UpdateRubricInput
) {
  const rubric = await prisma.rubric.findUnique({
    where: { id: rubricId },
    select: { id: true, tenantId: true },
  });

  if (!rubric) throw errors.notFound("ไม่พบ Rubric");
  if (rubric.tenantId !== tenantId) throw errors.forbidden();

  return prisma.$transaction(async (tx) => {
    // Update rubric fields
    await tx.rubric.update({
      where: { id: rubricId },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    // Replace criteria if provided
    if (input.criteria) {
      await tx.rubricCriteria.deleteMany({ where: { rubricId } });
      await tx.rubricCriteria.createMany({
        data: input.criteria.map((c, i) => ({
          rubricId,
          name: c.name,
          description: c.description,
          maxScore: c.maxScore,
          sortOrder: c.sortOrder ?? i,
        })),
      });
    }

    return tx.rubric.findUnique({
      where: { id: rubricId },
      include: {
        criteria: { orderBy: { sortOrder: "asc" } },
        exam: { select: { id: true, title: true } },
      },
    });
  });
}

// ─── Delete Rubric ──────────────────────────────────────────────────

export async function deleteRubric(tenantId: string, rubricId: string) {
  const rubric = await prisma.rubric.findUnique({
    where: { id: rubricId },
    select: { id: true, tenantId: true },
  });

  if (!rubric) throw errors.notFound("ไม่พบ Rubric");
  if (rubric.tenantId !== tenantId) throw errors.forbidden();

  return prisma.rubric.delete({ where: { id: rubricId } });
}
