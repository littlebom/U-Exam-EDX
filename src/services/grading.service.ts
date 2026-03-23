import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { sendNotification } from "@/services/notification.service";
import { buildPaginationMeta } from "@/types";
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
    meta: buildPaginationMeta(page, perPage, total),
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
    ...(status === "pending" && { gradedById: null }),
    ...(status === "graded" && { gradedById: { not: null } }),
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
    meta: buildPaginationMeta(page, perPage, total),
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

  return prisma.$transaction(async (tx) => {
    await tx.gradeAnswer.update({
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

    // Recalculate grade totals + check if fully graded
    return recalculateGrade(tx, gradeId);
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
    // Batch fetch all grade answers — 1 query instead of N
    const answerIds = input.answers.map((a) => a.answerId);
    const gradeAnswers = await tx.gradeAnswer.findMany({
      where: { gradeId, answerId: { in: answerIds } },
    });
    const gaMap = new Map(gradeAnswers.map((ga) => [ga.answerId, ga]));

    // Update each (still N updates — unavoidable since each has different score/feedback)
    for (const answer of input.answers) {
      const ga = gaMap.get(answer.answerId);
      if (!ga) continue;

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
    (ga) => !ga.isAutoGraded && ga.gradedById === null
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
    select: {
      id: true,
      tenantId: true,
      status: true,
      totalScore: true,
      maxScore: true,
      isPassed: true,
      session: {
        select: {
          candidateId: true,
          examSchedule: {
            select: {
              id: true,
              settings: true,
              exam: { select: { title: true } },
            },
          },
        },
      },
    },
  });

  if (!grade) throw errors.notFound("ไม่พบข้อมูลคะแนน");
  if (grade.tenantId !== tenantId) throw errors.forbidden();
  if (grade.status !== "COMPLETED") {
    throw errors.validation("ตรวจให้คะแนนยังไม่ครบ ไม่สามารถเผยแพร่ได้");
  }

  const updated = await prisma.grade.update({
    where: { id: gradeId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
    include: gradeListInclude,
  });

  // Notify candidate
  const examTitle = grade.session.examSchedule.exam.title;
  sendNotification({
    tenantId,
    userId: grade.session.candidateId,
    type: "RESULT_PUBLISHED",
    title: "ผลสอบของคุณพร้อมแล้ว",
    message: `${examTitle} — คะแนน ${grade.totalScore}/${grade.maxScore} (${grade.isPassed ? "ผ่าน" : "ไม่ผ่าน"})`,
    link: "/profile/results",
  }).catch((err) => console.error("[notification] publishGrade error:", err));

  // Auto-issue certificate if passed and template is configured
  if (grade.isPassed) {
    try {
      const schedSettings = grade.session.examSchedule.settings as Record<string, unknown> | null;
      const templateId = schedSettings?.certificateTemplateId as string | undefined;
      if (templateId) {
        const { issueCertificate } = await import("@/services/certificate.service");
        await issueCertificate(tenantId, {
          templateId,
          candidateId: grade.session.candidateId,
          gradeId: grade.id,
        });

        // Notify certificate issued
        sendNotification({
          tenantId,
          userId: grade.session.candidateId,
          type: "CERTIFICATE_ISSUED",
          title: "ใบรับรองของคุณพร้อมแล้ว",
          message: `คุณได้รับใบรับรองสำหรับ ${examTitle}`,
          link: "/profile/certificates",
        }).catch(() => {});
      }
    } catch (err) {
      // Certificate issue failure should not block grade publishing
      console.error("[auto-certificate] error:", err);
    }
  }

  return updated;
}

// ─── Publish Multiple Grades ────────────────────────────────────────

export async function bulkPublishGrades(tenantId: string, gradeIds: string[]) {
  // Use publishGrade for each to trigger notifications + auto-certificate
  const results = [];
  for (const gradeId of gradeIds) {
    try {
      const result = await publishGrade(tenantId, gradeId);
      results.push(result);
    } catch (err) {
      console.error(`[bulkPublish] Failed to publish grade ${gradeId}:`, err);
    }
  }
  return { count: results.length };
}

// ─── Grading Stats ──────────────────────────────────────────────────

export async function getGradingStats(tenantId: string) {
  // Consolidate: 2 groupBy + 2 counts instead of 8 separate queries
  const [gradeGroups, appealGroups, manualPending, manualGraded] = await Promise.all([
    prisma.grade.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true,
    }),
    prisma.appeal.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true,
    }),
    prisma.gradeAnswer.count({
      where: {
        grade: { tenantId, status: { in: ["GRADING", "DRAFT"] } },
        isAutoGraded: false,
        gradedById: null,
      },
    }),
    prisma.gradeAnswer.count({
      where: {
        grade: { tenantId },
        isAutoGraded: false,
        gradedById: { not: null },
      },
    }),
  ]);

  const gradeMap = Object.fromEntries(gradeGroups.map((g) => [g.status, g._count]));
  const appealMap = Object.fromEntries(appealGroups.map((g) => [g.status, g._count]));
  const totalAppeals = appealGroups.reduce((sum, g) => sum + g._count, 0);

  const pending = gradeMap["DRAFT"] ?? 0;
  const grading = gradeMap["GRADING"] ?? 0;
  const completed = gradeMap["COMPLETED"] ?? 0;
  const published = gradeMap["PUBLISHED"] ?? 0;
  const pendingAppeals = appealMap["PENDING"] ?? 0;

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
    meta: buildPaginationMeta(page, perPage, total),
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
