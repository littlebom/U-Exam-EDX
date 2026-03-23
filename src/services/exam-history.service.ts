import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { buildPaginationMeta } from "@/types";

// ─── List Exam Results ──────────────────────────────────────────────

export async function listExamResults(
  userId: string,
  filters: { page?: number; perPage?: number } = {}
) {
  const { page = 1, perPage = 20 } = filters;

  const where = { session: { candidateId: userId } };

  const [total, results] = await Promise.all([
    prisma.grade.count({ where }),
    prisma.grade.findMany({
      where,
      include: {
        session: {
          select: {
            id: true,
            startedAt: true,
            submittedAt: true,
            examSchedule: {
              select: {
                exam: { select: { id: true, title: true } },
                startDate: true,
              },
            },
          },
        },
      },
      orderBy: { gradedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    data: results.map((g) => ({
      id: g.id,
      examTitle: g.session.examSchedule.exam.title,
      examId: g.session.examSchedule.exam.id,
      examDate: g.session.examSchedule.startDate,
      totalScore: g.totalScore,
      maxScore: g.maxScore,
      percentage: g.percentage,
      isPassed: g.isPassed,
      status: g.status,
      gradedAt: g.gradedAt,
      sessionId: g.session.id,
    })),
    meta: buildPaginationMeta(page, perPage, total),
  };
}

// ─── Get Single Result Detail ───────────────────────────────────────

export async function getExamResultDetail(userId: string, gradeId: string) {
  const grade = await prisma.grade.findFirst({
    where: { id: gradeId, session: { candidateId: userId } },
    include: {
      session: {
        select: {
          id: true,
          startedAt: true,
          submittedAt: true,
          examSchedule: {
            select: {
              exam: {
                select: {
                  id: true,
                  title: true,
                  passingScore: true,
                  duration: true,
                },
              },
              startDate: true,
            },
          },
        },
      },
      gradeAnswers: {
        include: {
          answer: {
            select: {
              question: {
                select: {
                  id: true,
                  content: true,
                  type: true,
                  points: true,
                  subject: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!grade) throw errors.notFound("ไม่พบผลสอบ");

  // Calculate category scores
  const categoryScores = new Map<
    string,
    { name: string; score: number; maxScore: number }
  >();

  for (const ga of grade.gradeAnswers) {
    const question = ga.answer.question;
    const catName = question.subject?.name ?? "อื่นๆ";
    const catId = question.subject?.id ?? "other";
    const existing = categoryScores.get(catId) ?? {
      name: catName,
      score: 0,
      maxScore: 0,
    };
    existing.score += ga.score ?? 0;
    existing.maxScore += ga.maxScore ?? question.points;
    categoryScores.set(catId, existing);
  }

  return {
    id: grade.id,
    exam: grade.session.examSchedule.exam,
    examDate: grade.session.examSchedule.startDate,
    totalScore: grade.totalScore,
    maxScore: grade.maxScore,
    percentage: grade.percentage,
    isPassed: grade.isPassed,
    status: grade.status,
    gradedAt: grade.gradedAt,
    startedAt: grade.session.startedAt,
    submittedAt: grade.session.submittedAt,
    categoryScores: Array.from(categoryScores.entries()).map(
      ([id, data]) => ({
        categoryId: id,
        categoryName: data.name,
        score: data.score,
        maxScore: data.maxScore,
        percentage:
          data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0,
      })
    ),
    totalQuestions: grade.gradeAnswers.length,
    correctAnswers: grade.gradeAnswers.filter(
      (ga) => ga.score !== null && ga.maxScore !== null && ga.score >= ga.maxScore
    ).length,
  };
}

// ─── Get Registrations History ──────────────────────────────────────

export async function getRegistrationHistory(
  userId: string,
  filters: { page?: number; perPage?: number } = {}
) {
  const { page = 1, perPage = 20 } = filters;

  const where = { candidateId: userId };

  const [total, registrations] = await Promise.all([
    prisma.registration.count({ where }),
    prisma.registration.findMany({
      where,
      include: {
        examSchedule: {
          select: {
            startDate: true,
            status: true,
            exam: { select: { id: true, title: true } },
          },
        },
        testCenter: { select: { id: true, name: true } },
        vouchers: { select: { code: true, status: true, isUsed: true }, take: 1 },
        payments: {
          select: { id: true, amount: true, status: true, method: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    data: registrations.map((r) => ({
      id: r.id,
      examTitle: r.examSchedule.exam.title,
      examDate: r.examSchedule.startDate,
      scheduleStatus: r.examSchedule.status,
      testCenter: r.testCenter,
      seatNumber: r.seatNumber,
      status: r.status,
      paymentStatus: r.paymentStatus,
      payment: r.payments[0] ?? null,
      voucher: r.vouchers[0] ?? null,
      createdAt: r.createdAt,
    })),
    meta: buildPaginationMeta(page, perPage, total),
  };
}
