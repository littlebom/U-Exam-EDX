import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";

// ─── Types ──────────────────────────────────────────────────────────

interface ModerateInput {
  gradeAnswerId: string;
  moderatedScore: number;
}

// ─── Get Double Grading Status ──────────────────────────────────────

export async function getDoubleGradingStatus(tenantId: string, gradeId: string) {
  const grade = await prisma.grade.findUnique({
    where: { id: gradeId },
    include: {
      gradeAnswers: {
        include: {
          answer: {
            include: {
              question: {
                select: { id: true, type: true, content: true, points: true },
              },
            },
          },
          gradedBy: { select: { id: true, name: true } },
          moderatedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!grade) throw errors.notFound("ไม่พบข้อมูลคะแนน");
  if (grade.tenantId !== tenantId) throw errors.forbidden();

  // Group answers by answerId to find 1st/2nd round
  const answerGroups = new Map<string, typeof grade.gradeAnswers>();
  for (const ga of grade.gradeAnswers) {
    const key = ga.answerId;
    if (!answerGroups.has(key)) answerGroups.set(key, []);
    answerGroups.get(key)!.push(ga);
  }

  const items = Array.from(answerGroups.entries()).map(([answerId, rounds]) => {
    const round1 = rounds.find((r) => r.gradingRound === 1);
    const round2 = rounds.find((r) => r.gradingRound === 2);
    const discrepancy =
      round1 && round2
        ? Math.abs(round1.score - round2.score)
        : null;

    return {
      answerId,
      question: round1?.answer.question ?? round2?.answer.question,
      round1: round1
        ? { id: round1.id, score: round1.score, maxScore: round1.maxScore, gradedBy: round1.gradedBy, feedback: round1.feedback }
        : null,
      round2: round2
        ? { id: round2.id, score: round2.score, maxScore: round2.maxScore, gradedBy: round2.gradedBy, feedback: round2.feedback }
        : null,
      moderatedScore: round1?.moderatedScore ?? round2?.moderatedScore ?? null,
      moderatedBy: round1?.moderatedBy ?? round2?.moderatedBy ?? null,
      discrepancy,
      needsModeration: discrepancy !== null && discrepancy > 0,
    };
  });

  return {
    gradeId,
    status: grade.status,
    items,
    summary: {
      total: items.length,
      round1Done: items.filter((i) => i.round1 !== null).length,
      round2Done: items.filter((i) => i.round2 !== null).length,
      moderated: items.filter((i) => i.moderatedScore !== null).length,
      discrepancies: items.filter((i) => i.needsModeration).length,
    },
  };
}

// ─── Moderate Score ─────────────────────────────────────────────────

export async function moderateScore(
  tenantId: string,
  gradeId: string,
  moderatorId: string,
  input: ModerateInput
) {
  const gradeAnswer = await prisma.gradeAnswer.findUnique({
    where: { id: input.gradeAnswerId },
    include: { grade: { select: { tenantId: true } } },
  });

  if (!gradeAnswer) throw errors.notFound("ไม่พบข้อมูลคะแนนรายข้อ");
  if (gradeAnswer.grade.tenantId !== tenantId) throw errors.forbidden();
  if (gradeAnswer.gradeId !== gradeId) throw errors.validation("Grade ID ไม่ตรงกัน");

  if (input.moderatedScore < 0 || input.moderatedScore > gradeAnswer.maxScore) {
    throw errors.validation(
      `คะแนนต้องอยู่ระหว่าง 0 - ${gradeAnswer.maxScore}`
    );
  }

  // Update moderated score on the first round answer
  const updated = await prisma.gradeAnswer.update({
    where: { id: input.gradeAnswerId },
    data: {
      moderatedScore: input.moderatedScore,
      moderatedById: moderatorId,
      moderatedAt: new Date(),
      // Also update the actual score to the moderated value
      score: input.moderatedScore,
    },
  });

  // Recalculate grade totals
  const allAnswers = await prisma.gradeAnswer.findMany({
    where: { gradeId, gradingRound: 1 },
  });

  const totalScore = allAnswers.reduce(
    (sum, ga) => sum + (ga.moderatedScore ?? ga.score),
    0
  );
  const maxScore = allAnswers.reduce((sum, ga) => sum + ga.maxScore, 0);
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  const grade = await prisma.grade.findUnique({
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

  await prisma.grade.update({
    where: { id: gradeId },
    data: {
      totalScore: Math.round(totalScore * 100) / 100,
      maxScore,
      percentage: Math.round(percentage * 100) / 100,
      isPassed: percentage >= passingScore,
    },
  });

  return updated;
}
