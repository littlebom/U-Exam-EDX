import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";

// ─── Get Profile Dashboard ──────────────────────────────────────────

export async function getProfileDashboard(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      imageUrl: true,
      provider: true,
      createdAt: true,
    },
  });

  if (!user) throw errors.notFound("ไม่พบผู้ใช้");

  // Get exam stats
  const [totalExams, passedExams, sessions] = await Promise.all([
    prisma.grade.count({ where: { session: { candidateId: userId } } }),
    prisma.grade.count({
      where: { session: { candidateId: userId }, isPassed: true },
    }),
    prisma.grade.findMany({
      where: { session: { candidateId: userId } },
      select: { percentage: true },
    }),
  ]);

  const avgScore =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((sum, s) => sum + (s.percentage ?? 0), 0) /
            sessions.length
        )
      : 0;

  return {
    user,
    stats: {
      totalExams,
      passedExams,
      passRate: totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0,
      avgScore,
    },
  };
}

// ─── Get Recent Results ─────────────────────────────────────────────

export async function getRecentResults(userId: string, limit = 5) {
  return prisma.grade.findMany({
    where: { session: { candidateId: userId } },
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
    take: limit,
  });
}

// ─── Get Score Trend (for progress chart) ───────────────────────────

export async function getScoreTrend(userId: string, limit = 10) {
  const grades = await prisma.grade.findMany({
    where: { session: { candidateId: userId } },
    include: {
      session: {
        select: {
          examSchedule: {
            select: {
              exam: { select: { title: true } },
              startDate: true,
            },
          },
        },
      },
    },
    orderBy: { gradedAt: "asc" },
    take: limit,
  });

  return grades.map((g) => ({
    examTitle: g.session.examSchedule.exam.title,
    date: g.session.examSchedule.startDate,
    score: g.percentage ?? 0,
    isPassed: g.isPassed,
  }));
}
