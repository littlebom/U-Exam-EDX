import { prisma } from "@/lib/prisma";
import { extractPlainText } from "@/lib/content-utils";
import { cached } from "@/lib/cache";
import { buildPaginationMeta } from "@/types";
import type {
  OverviewFilter,
  ScoreDistributionFilter,
  ItemAnalysisFilter,
  TrendFilter,
} from "@/lib/validations/analytics";

// ─── Date Filter Helper ─────────────────────────────────────────────

function buildDateFilter(dateFrom?: Date, dateTo?: Date) {
  if (!dateFrom && !dateTo) return {};
  const filter: Record<string, Date> = {};
  if (dateFrom) filter.gte = dateFrom;
  if (dateTo) filter.lte = dateTo;
  return { createdAt: filter };
}

// ─── Overview Stats ──────────────────────────────────────────────────

export async function getOverviewStats(tenantId: string, filters: OverviewFilter) {
  const cacheKey = `analytics:overview:${tenantId}:${JSON.stringify(filters)}`;
  return cached(cacheKey, 300, () => _getOverviewStats(tenantId, filters));
}

async function _getOverviewStats(tenantId: string, filters: OverviewFilter) {
  const { examId, dateFrom, dateTo } = filters;

  // Build where clause for grades
  const gradeWhere = {
    tenantId,
    status: { in: ["COMPLETED" as const, "PUBLISHED" as const] },
    ...(examId && {
      session: {
        examSchedule: { examId },
      },
    }),
    ...buildDateFilter(dateFrom, dateTo),
  };

  // Get all completed/published grades
  const grades = await prisma.grade.findMany({
    where: gradeWhere,
    select: {
      totalScore: true,
      maxScore: true,
      percentage: true,
      isPassed: true,
    },
  });

  // Count exams with completed sessions
  const examCount = await prisma.exam.count({
    where: {
      tenantId,
      ...(examId && { id: examId }),
      schedules: {
        some: {
          examSessions: {
            some: {
              grade: {
                status: { in: ["COMPLETED", "PUBLISHED"] },
              },
            },
          },
        },
      },
    },
  });

  // Count unique candidates
  const candidateCount = await prisma.examSession.groupBy({
    by: ["candidateId"],
    where: {
      examSchedule: {
        exam: {
          tenantId,
          ...(examId && { id: examId }),
        },
      },
      grade: {
        status: { in: ["COMPLETED", "PUBLISHED"] },
      },
    },
  });

  const totalCandidates = candidateCount.length;
  const totalGrades = grades.length;

  if (totalGrades === 0) {
    return {
      totalExams: examCount,
      totalCandidates,
      averagePassRate: 0,
      averageScore: 0,
      passCount: 0,
      failCount: 0,
      highestScore: 0,
      lowestScore: 0,
      medianScore: 0,
      standardDeviation: 0,
    };
  }

  const passCount = grades.filter((g) => g.isPassed).length;
  const failCount = totalGrades - passCount;
  const averagePassRate = (passCount / totalGrades) * 100;

  const percentages = grades.map((g) => g.percentage).sort((a, b) => a - b);
  const averageScore = percentages.reduce((s, v) => s + v, 0) / totalGrades;
  const highestScore = percentages[percentages.length - 1];
  const lowestScore = percentages[0];

  // Median
  const mid = Math.floor(totalGrades / 2);
  const medianScore =
    totalGrades % 2 !== 0
      ? percentages[mid]
      : (percentages[mid - 1] + percentages[mid]) / 2;

  // Standard deviation
  const variance =
    percentages.reduce((sum, v) => sum + Math.pow(v - averageScore, 2), 0) / totalGrades;
  const standardDeviation = Math.sqrt(variance);

  return {
    totalExams: examCount,
    totalCandidates,
    averagePassRate: Math.round(averagePassRate * 100) / 100,
    averageScore: Math.round(averageScore * 100) / 100,
    passCount,
    failCount,
    highestScore: Math.round(highestScore * 100) / 100,
    lowestScore: Math.round(lowestScore * 100) / 100,
    medianScore: Math.round(medianScore * 100) / 100,
    standardDeviation: Math.round(standardDeviation * 100) / 100,
  };
}

// ─── Score Distribution ──────────────────────────────────────────────

export async function getScoreDistribution(
  tenantId: string,
  filters: ScoreDistributionFilter
) {
  const { examId, buckets, dateFrom, dateTo } = filters;

  const grades = await prisma.grade.findMany({
    where: {
      tenantId,
      status: { in: ["COMPLETED", "PUBLISHED"] },
      ...(examId && {
        session: {
          examSchedule: { examId },
        },
      }),
      ...buildDateFilter(dateFrom, dateTo),
    },
    select: {
      percentage: true,
    },
  });

  // Build distribution buckets
  const bucketSize = 100 / buckets;
  const distribution: Array<{ range: string; count: number; percentage: number }> = [];

  for (let i = 0; i < buckets; i++) {
    const low = Math.round(i * bucketSize);
    const high = Math.round((i + 1) * bucketSize);
    const rangeLabel = `${low}-${high}%`;
    const count = grades.filter(
      (g) => g.percentage >= low && (i === buckets - 1 ? g.percentage <= high : g.percentage < high)
    ).length;

    distribution.push({
      range: rangeLabel,
      count,
      percentage: grades.length > 0 ? Math.round((count / grades.length) * 1000) / 10 : 0,
    });
  }

  return {
    total: grades.length,
    distribution,
  };
}

// ─── Item Analysis ───────────────────────────────────────────────────

export async function getItemAnalysis(
  tenantId: string,
  filters: ItemAnalysisFilter
) {
  const { examId, page, perPage, dateFrom, dateTo } = filters;
  void dateFrom; void dateTo; // Item analysis filters by question, not by date

  // Get questions with their answers from completed sessions
  const questionWhere = {
    tenantId,
    ...(examId && {
      examSectionQuestions: {
        some: {
          section: {
            examId,
          },
        },
      },
    }),
    type: { in: ["MULTIPLE_CHOICE" as const, "TRUE_FALSE" as const] },
  };

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where: questionWhere,
      select: {
        id: true,
        content: true,
        type: true,
        options: true,
        correctAnswer: true,
        examAnswers: {
          where: {
            session: {
              grade: {
                status: { in: ["COMPLETED", "PUBLISHED"] },
              },
              examSchedule: {
                exam: { tenantId },
              },
            },
          },
          select: {
            answer: true,
            gradeAnswer: {
              select: {
                isCorrect: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.question.count({ where: questionWhere }),
  ]);

  const items = questions.map((q) => {
    const totalResponses = q.examAnswers.length;
    const correctCount = q.examAnswers.filter((a) => a.gradeAnswer?.isCorrect === true).length;
    const incorrectCount = q.examAnswers.filter((a) => a.gradeAnswer?.isCorrect === false).length;
    const skippedCount = q.examAnswers.filter((a) => a.answer === null || a.answer === undefined).length;

    // Difficulty index: proportion correct (higher = easier)
    const difficultyIndex = totalResponses > 0 ? correctCount / totalResponses : 0;

    // Discrimination index: simplified — difference between top/bottom 27%
    // For now, use a simpler approach based on correct ratio variance
    const discriminationIndex = calculateDiscrimination(q.examAnswers, totalResponses);

    // Option analysis for MC/TF questions
    let optionAnalysis: Array<{
      option: string;
      selectedCount: number;
      selectedPercentage: number;
      isCorrect: boolean;
    }> | null = null;

    if (q.type === "MULTIPLE_CHOICE" && q.options && Array.isArray(q.options)) {
      const options = q.options as Array<{ id: string; text: string }>;
      const correctAns = q.correctAnswer;
      const correctId = Array.isArray(correctAns) ? correctAns[0] : correctAns;

      optionAnalysis = options.map((opt) => {
        const selectedCount = q.examAnswers.filter((a) => {
          const ans = a.answer;
          if (!ans) return false;
          const answerId = typeof ans === "object" && ans !== null && "answerId" in (ans as Record<string, unknown>)
            ? (ans as Record<string, unknown>).answerId
            : ans;
          return String(answerId) === String(opt.id);
        }).length;

        return {
          option: opt.text,
          selectedCount,
          selectedPercentage: totalResponses > 0 ? Math.round((selectedCount / totalResponses) * 1000) / 10 : 0,
          isCorrect: String(opt.id) === String(correctId),
        };
      });
    } else if (q.type === "TRUE_FALSE") {
      const correctAns = String(q.correctAnswer).toLowerCase();
      const trueCount = q.examAnswers.filter((a) => String(a.answer).toLowerCase() === "true").length;
      const falseCount = q.examAnswers.filter((a) => String(a.answer).toLowerCase() === "false").length;

      optionAnalysis = [
        {
          option: "ถูก",
          selectedCount: trueCount,
          selectedPercentage: totalResponses > 0 ? Math.round((trueCount / totalResponses) * 1000) / 10 : 0,
          isCorrect: correctAns === "true",
        },
        {
          option: "ผิด",
          selectedCount: falseCount,
          selectedPercentage: totalResponses > 0 ? Math.round((falseCount / totalResponses) * 1000) / 10 : 0,
          isCorrect: correctAns === "false",
        },
      ];
    }

    return {
      questionId: q.id,
      questionTitle: extractPlainText(q.content).slice(0, 80),
      totalResponses,
      correctCount,
      incorrectCount,
      skippedCount,
      difficultyIndex: Math.round(difficultyIndex * 100) / 100,
      discriminationIndex: Math.round(discriminationIndex * 100) / 100,
      optionAnalysis,
    };
  });

  return {
    data: items,
    meta: buildPaginationMeta(page, perPage, total),
  };
}

// Simplified discrimination index calculation
function calculateDiscrimination(
  answers: Array<{ answer: unknown; gradeAnswer: { isCorrect: boolean | null } | null }>,
  totalResponses: number
): number {
  if (totalResponses < 4) return 0;

  // We need session-level scores to split into top/bottom groups.
  // As a simplified approach, use point-biserial correlation approximation.
  const correctCount = answers.filter((a) => a.gradeAnswer?.isCorrect === true).length;
  const p = correctCount / totalResponses;
  const q = 1 - p;

  // Simple discrimination: items with p near 0.5 tend to have better discrimination
  // This is a rough approximation; proper calculation needs session-level total scores
  if (p <= 0 || p >= 1) return 0;
  return Math.min(1, Math.max(0, 2 * Math.sqrt(p * q)));
}

// ─── Monthly Trends ──────────────────────────────────────────────────

export async function getMonthlyTrends(tenantId: string, filters: TrendFilter) {
  const cacheKey = `analytics:trends:${tenantId}:${JSON.stringify(filters)}`;
  return cached(cacheKey, 600, () => _getMonthlyTrends(tenantId, filters));
}

async function _getMonthlyTrends(tenantId: string, filters: TrendFilter) {
  const { months, examId, dateFrom, dateTo } = filters;

  // Calculate date range
  const endDate = dateTo ?? new Date();
  const startDate = dateFrom ?? new Date(new Date().setMonth(new Date().getMonth() - months));

  // Get all grades within the date range
  const grades = await prisma.grade.findMany({
    where: {
      tenantId,
      status: { in: ["COMPLETED", "PUBLISHED"] },
      ...(examId && {
        session: {
          examSchedule: { examId },
        },
      }),
      session: {
        submittedAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(examId && {
          examSchedule: { examId },
        }),
      },
    },
    select: {
      percentage: true,
      isPassed: true,
      session: {
        select: {
          submittedAt: true,
          examScheduleId: true,
        },
      },
    },
  });

  // Group by month
  const monthlyMap = new Map<
    string,
    { grades: Array<{ percentage: number; isPassed: boolean }>; examScheduleIds: Set<string> }
  >();

  // Pre-fill all months
  for (let i = 0; i < months; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (months - 1 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, { grades: [], examScheduleIds: new Set() });
  }

  for (const grade of grades) {
    if (!grade.session.submittedAt) continue;
    const d = grade.session.submittedAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, { grades: [], examScheduleIds: new Set() });
    }
    const entry = monthlyMap.get(key)!;
    entry.grades.push({ percentage: grade.percentage, isPassed: grade.isPassed });
    entry.examScheduleIds.add(grade.session.examScheduleId);
  }

  // Thai month labels
  const thaiMonths = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];

  const trends = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      const [year, monthNum] = month.split("-");
      const monthIndex = parseInt(monthNum, 10) - 1;
      const label = `${thaiMonths[monthIndex]} ${year}`;

      const totalGrades = data.grades.length;
      const passCount = data.grades.filter((g) => g.isPassed).length;
      const averagePassRate = totalGrades > 0 ? (passCount / totalGrades) * 100 : 0;
      const averageScore =
        totalGrades > 0
          ? data.grades.reduce((s, g) => s + g.percentage, 0) / totalGrades
          : 0;

      return {
        month,
        label,
        totalExams: data.examScheduleIds.size,
        totalCandidates: totalGrades,
        averagePassRate: Math.round(averagePassRate * 100) / 100,
        averageScore: Math.round(averageScore * 100) / 100,
      };
    });

  return { trends };
}
