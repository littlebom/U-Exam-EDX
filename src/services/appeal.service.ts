import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type { PaginationMeta } from "@/types";
import type { Prisma } from "@/generated/prisma";
import type {
  CreateAppealInput,
  ResolveAppealInput,
  AppealFilter,
} from "@/lib/validations/grading";

// ─── Shared Includes ────────────────────────────────────────────────

const appealInclude = {
  session: {
    include: {
      examSchedule: {
        include: {
          exam: { select: { id: true, title: true } },
        },
      },
    },
  },
  candidate: { select: { id: true, name: true, email: true } },
  resolvedBy: { select: { id: true, name: true } },
} satisfies Prisma.AppealInclude;

// ─── List Appeals ───────────────────────────────────────────────────

export async function listAppeals(
  tenantId: string,
  filters: AppealFilter
): Promise<{ data: unknown[]; meta: PaginationMeta }> {
  const { sessionId, status, page, perPage } = filters;

  const where: Prisma.AppealWhereInput = {
    tenantId,
    ...(sessionId && { sessionId }),
    ...(status && { status }),
  };

  const [data, total] = await Promise.all([
    prisma.appeal.findMany({
      where,
      include: appealInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.appeal.count({ where }),
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

// ─── Get Appeal Detail ──────────────────────────────────────────────

export async function getAppeal(tenantId: string, appealId: string) {
  const appeal = await prisma.appeal.findUnique({
    where: { id: appealId },
    include: {
      ...appealInclude,
      session: {
        include: {
          examSchedule: {
            include: {
              exam: { select: { id: true, title: true } },
            },
          },
          answers: {
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
              gradeAnswer: {
                select: {
                  id: true,
                  score: true,
                  maxScore: true,
                  feedback: true,
                  rubricScores: true,
                  isAutoGraded: true,
                  gradedBy: { select: { id: true, name: true } },
                },
              },
            },
          },
          grade: {
            select: {
              id: true,
              totalScore: true,
              maxScore: true,
              percentage: true,
              isPassed: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!appeal) throw errors.notFound("ไม่พบคำร้องอุทธรณ์");
  if (appeal.tenantId !== tenantId) throw errors.forbidden();

  return appeal;
}

// ─── Create Appeal (by candidate) ───────────────────────────────────

export async function createAppeal(
  tenantId: string,
  candidateId: string,
  input: CreateAppealInput
) {
  // Verify session belongs to candidate
  const session = await prisma.examSession.findUnique({
    where: { id: input.sessionId },
    include: {
      examSchedule: {
        include: {
          exam: {
            select: { tenantId: true, appealDeadlineDays: true },
          },
        },
      },
      grade: { select: { id: true, status: true, publishedAt: true } },
    },
  });

  if (!session) throw errors.notFound("ไม่พบ Session");
  if (session.candidateId !== candidateId) throw errors.forbidden("ไม่ใช่ Session ของคุณ");
  if (session.examSchedule.exam.tenantId !== tenantId) throw errors.forbidden();

  // Must have a published grade
  if (!session.grade || session.grade.status !== "PUBLISHED") {
    throw errors.validation("ยังไม่สามารถอุทธรณ์ได้ — ผลคะแนนยังไม่ได้เผยแพร่");
  }

  // Check appeal deadline
  const deadlineDays = session.examSchedule.exam.appealDeadlineDays;
  if (deadlineDays != null && session.grade.publishedAt) {
    const publishedAt = new Date(session.grade.publishedAt);
    const deadline = new Date(publishedAt.getTime() + deadlineDays * 24 * 60 * 60 * 1000);
    if (new Date() > deadline) {
      throw errors.validation(
        `หมดเวลาอุทธรณ์ — สามารถอุทธรณ์ได้ภายใน ${deadlineDays} วันหลังเผยแพร่คะแนน`
      );
    }
  }

  // Check for duplicate appeal on same question
  if (input.questionId) {
    const existing = await prisma.appeal.findFirst({
      where: {
        sessionId: input.sessionId,
        questionId: input.questionId,
        status: "PENDING",
      },
    });
    if (existing) throw errors.conflict("มีคำร้องอุทธรณ์ข้อนี้อยู่แล้ว");
  }

  return prisma.appeal.create({
    data: {
      tenantId,
      sessionId: input.sessionId,
      candidateId,
      questionId: input.questionId,
      originalScore: input.originalScore,
      reason: input.reason,
    },
    include: appealInclude,
  });
}

// ─── Resolve Appeal (approve/reject) ────────────────────────────────

export async function resolveAppeal(
  tenantId: string,
  appealId: string,
  resolvedById: string,
  input: ResolveAppealInput
) {
  const appeal = await prisma.appeal.findUnique({
    where: { id: appealId },
    include: {
      session: {
        include: {
          grade: { select: { id: true } },
        },
      },
    },
  });

  if (!appeal) throw errors.notFound("ไม่พบคำร้องอุทธรณ์");
  if (appeal.tenantId !== tenantId) throw errors.forbidden();
  if (appeal.status !== "PENDING") {
    throw errors.validation("คำร้องนี้ได้รับการดำเนินการแล้ว");
  }

  return prisma.$transaction(async (tx) => {
    // Update appeal
    const updated = await tx.appeal.update({
      where: { id: appealId },
      data: {
        status: input.status,
        response: input.response,
        newScore: input.status === "APPROVED" ? input.newScore : null,
        resolvedById,
        resolvedAt: new Date(),
      },
      include: appealInclude,
    });

    // If approved and newScore provided, update the grade answer
    if (input.status === "APPROVED" && input.newScore !== undefined && appeal.questionId) {
      const gradeId = appeal.session.grade?.id;
      if (gradeId) {
        // Find the answer for this question
        const answer = await tx.examAnswer.findFirst({
          where: {
            sessionId: appeal.sessionId,
            questionId: appeal.questionId,
          },
        });

        if (answer) {
          await tx.gradeAnswer.update({
            where: { answerId: answer.id },
            data: { score: input.newScore },
          });

          // Recalculate grade totals
          const allGradeAnswers = await tx.gradeAnswer.findMany({
            where: { gradeId },
          });

          const totalScore = allGradeAnswers.reduce((sum, ga) => sum + ga.score, 0);
          const maxScore = allGradeAnswers.reduce((sum, ga) => sum + ga.maxScore, 0);
          const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

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

          await tx.grade.update({
            where: { id: gradeId },
            data: {
              totalScore: Math.round(totalScore * 100) / 100,
              maxScore,
              percentage: Math.round(percentage * 100) / 100,
              isPassed: percentage >= passingScore,
            },
          });
        }
      }
    }

    return updated;
  });
}

// ─── Appeal Stats ───────────────────────────────────────────────────

export async function getAppealStats(tenantId: string) {
  const [pending, approved, rejected] = await Promise.all([
    prisma.appeal.count({ where: { tenantId, status: "PENDING" } }),
    prisma.appeal.count({ where: { tenantId, status: "APPROVED" } }),
    prisma.appeal.count({ where: { tenantId, status: "REJECTED" } }),
  ]);

  return { pending, approved, rejected, total: pending + approved + rejected };
}
