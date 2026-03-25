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

  // Use aggregate instead of loading all rows into memory
  const [agg, passAgg] = await Promise.all([
    prisma.grade.aggregate({
      where: gradeWhere,
      _count: true,
      _avg: { percentage: true },
      _min: { percentage: true },
      _max: { percentage: true },
    }),
    prisma.grade.count({
      where: { ...gradeWhere, isPassed: true },
    }),
  ]);

  // For median + stddev, use raw SQL (much cheaper than loading all rows)
  const statsResult = await prisma.$queryRaw<
    Array<{ median: number | null; stddev: number | null }>
  >`
    SELECT
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY percentage) AS median,
      STDDEV_POP(percentage) AS stddev
    FROM "Grade"
    WHERE "tenantId" = ${tenantId}
      AND status IN ('COMPLETED', 'PUBLISHED')
      ${examId ? prisma.$queryRaw`AND "sessionId" IN (
        SELECT es.id FROM "ExamSession" es
        JOIN "ExamSchedule" esc ON es."examScheduleId" = esc.id
        WHERE esc."examId" = ${examId}
      )` : prisma.$queryRaw``}
  `.catch(() => [{ median: null, stddev: null }]);

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
  const totalGrades = agg._count;
  const passCount = passAgg;
  const failCount = totalGrades - passCount;
  const averagePassRate = totalGrades > 0 ? (passCount / totalGrades) * 100 : 0;
  const stats = statsResult[0] ?? { median: null, stddev: null };

  return {
    totalExams: examCount,
    totalCandidates,
    averagePassRate: Math.round(averagePassRate * 100) / 100,
    averageScore: Math.round((agg._avg.percentage ?? 0) * 100) / 100,
    passCount,
    failCount,
    highestScore: Math.round((agg._max.percentage ?? 0) * 100) / 100,
    lowestScore: Math.round((agg._min.percentage ?? 0) * 100) / 100,
    medianScore: Math.round((Number(stats.median) || 0) * 100) / 100,
    standardDeviation: Math.round((Number(stats.stddev) || 0) * 100) / 100,
  };
}

// ─── Score Distribution ──────────────────────────────────────────────

export async function getScoreDistribution(
  tenantId: string,
  filters: ScoreDistributionFilter
) {
  const { examId, buckets, dateFrom, dateTo } = filters;

  // Use aggregate count instead of loading all rows
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

  const totalCount = await prisma.grade.count({ where: gradeWhere });

  // Fetch all percentages in 1 query, then bucket in memory (avoids N separate count queries)
  const bucketSize = 100 / buckets;
  const allPercentages = await prisma.grade.findMany({
    where: gradeWhere,
    select: { percentage: true },
  });

  const bucketCounts = new Array(buckets).fill(0);
  for (const g of allPercentages) {
    const pct = g.percentage ?? 0;
    let idx = Math.floor(pct / bucketSize);
    if (idx >= buckets) idx = buckets - 1; // 100% goes in last bucket
    bucketCounts[idx]++;
  }

  const distribution: Array<{ range: string; count: number; percentage: number }> = [];
  for (let i = 0; i < buckets; i++) {
    const low = Math.round(i * bucketSize);
    const high = Math.round((i + 1) * bucketSize);
    distribution.push({
      range: `${low}-${high}%`,
      count: bucketCounts[i],
      percentage: totalCount > 0 ? Math.round((bucketCounts[i] / totalCount) * 1000) / 10 : 0,
    });
  }

  return {
    total: totalCount,
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

  // Use raw SQL to aggregate by month — avoids loading all rows into memory
  type MonthlyRow = {
    month: string;
    total_candidates: bigint;
    pass_count: bigint;
    avg_score: number | null;
    exam_count: bigint;
  };

  const monthlyData = await prisma.$queryRaw<MonthlyRow[]>`
    SELECT
      TO_CHAR(es."submittedAt", 'YYYY-MM') AS month,
      COUNT(*)::bigint AS total_candidates,
      COUNT(*) FILTER (WHERE g."isPassed" = true)::bigint AS pass_count,
      AVG(g.percentage) AS avg_score,
      COUNT(DISTINCT es."examScheduleId")::bigint AS exam_count
    FROM "Grade" g
    JOIN "ExamSession" es ON g."sessionId" = es.id
    JOIN "ExamSchedule" esc ON es."examScheduleId" = esc.id
    WHERE g."tenantId" = ${tenantId}
      AND g.status IN ('COMPLETED', 'PUBLISHED')
      AND es."submittedAt" >= ${startDate}
      AND es."submittedAt" <= ${endDate}
      ${examId ? prisma.$queryRaw`AND esc."examId" = ${examId}` : prisma.$queryRaw``}
    GROUP BY TO_CHAR(es."submittedAt", 'YYYY-MM')
    ORDER BY month
  `.catch(() => [] as MonthlyRow[]);

  // Build monthly map with pre-filled months
  const monthlyMap = new Map<string, { totalCandidates: number; passCount: number; avgScore: number; examCount: number }>();

  for (let i = 0; i < months; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (months - 1 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, { totalCandidates: 0, passCount: 0, avgScore: 0, examCount: 0 });
  }

  for (const row of monthlyData) {
    monthlyMap.set(row.month, {
      totalCandidates: Number(row.total_candidates),
      passCount: Number(row.pass_count),
      avgScore: Number(row.avg_score) || 0,
      examCount: Number(row.exam_count),
    });
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

      const averagePassRate = data.totalCandidates > 0
        ? (data.passCount / data.totalCandidates) * 100
        : 0;

      return {
        month,
        label,
        totalExams: data.examCount,
        totalCandidates: data.totalCandidates,
        averagePassRate: Math.round(averagePassRate * 100) / 100,
        averageScore: Math.round(data.avgScore * 100) / 100,
      };
    });

  return { trends };
}
