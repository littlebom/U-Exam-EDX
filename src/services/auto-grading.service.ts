import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type { Prisma } from "@/generated/prisma";

// ─── Types ──────────────────────────────────────────────────────────

interface AutoGradeResult {
  answerId: string;
  questionId: string;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  isAutoGraded: boolean;
}

// Question types that can be auto-graded
const AUTO_GRADABLE_TYPES = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "MATCHING",
  "ORDERING",
  "FILL_IN_BLANK",
];

// ─── Auto-grade a single answer ─────────────────────────────────────

function gradeAnswer(
  questionType: string,
  candidateAnswer: unknown,
  correctAnswer: unknown,
  maxScore: number
): { score: number; isCorrect: boolean } {
  if (candidateAnswer === null || candidateAnswer === undefined) {
    return { score: 0, isCorrect: false };
  }

  switch (questionType) {
    case "MULTIPLE_CHOICE":
      return gradeMultipleChoice(candidateAnswer, correctAnswer, maxScore);
    case "TRUE_FALSE":
      return gradeTrueFalse(candidateAnswer, correctAnswer, maxScore);
    case "MATCHING":
      return gradeMatching(candidateAnswer, correctAnswer, maxScore);
    case "ORDERING":
      return gradeOrdering(candidateAnswer, correctAnswer, maxScore);
    case "FILL_IN_BLANK":
      return gradeFillInBlank(candidateAnswer, correctAnswer, maxScore);
    default:
      return { score: 0, isCorrect: false };
  }
}

// ─── MC: compare selected option ID ─────────────────────────────────

function gradeMultipleChoice(
  candidate: unknown,
  correct: unknown,
  maxScore: number
): { score: number; isCorrect: boolean } {
  // Support both single answer and array format
  const candidateVal = Array.isArray(candidate) ? candidate : [candidate];
  const correctVal = Array.isArray(correct) ? correct : [correct];

  // Sort both for comparison
  const candidateSorted = [...candidateVal].sort();
  const correctSorted = [...correctVal].sort();

  const isCorrect =
    candidateSorted.length === correctSorted.length &&
    candidateSorted.every((v, i) => String(v) === String(correctSorted[i]));

  return { score: isCorrect ? maxScore : 0, isCorrect };
}

// ─── T/F: compare boolean value ─────────────────────────────────────

function gradeTrueFalse(
  candidate: unknown,
  correct: unknown,
  maxScore: number
): { score: number; isCorrect: boolean } {
  const isCorrect = String(candidate).toLowerCase() === String(correct).toLowerCase();
  return { score: isCorrect ? maxScore : 0, isCorrect };
}

// ─── Matching: compare pairs, partial credit ────────────────────────

function gradeMatching(
  candidate: unknown,
  correct: unknown,
  maxScore: number
): { score: number; isCorrect: boolean } {
  if (!candidate || !correct) return { score: 0, isCorrect: false };

  const candidatePairs = candidate as Record<string, string>;
  const correctPairs = correct as Record<string, string>;
  const totalPairs = Object.keys(correctPairs).length;

  if (totalPairs === 0) return { score: 0, isCorrect: false };

  let correctCount = 0;
  for (const key of Object.keys(correctPairs)) {
    if (String(candidatePairs[key]) === String(correctPairs[key])) {
      correctCount++;
    }
  }

  const isCorrect = correctCount === totalPairs;
  const score = (correctCount / totalPairs) * maxScore;
  return { score: Math.round(score * 100) / 100, isCorrect };
}

// ─── Ordering: compare sequence, partial credit ─────────────────────

function gradeOrdering(
  candidate: unknown,
  correct: unknown,
  maxScore: number
): { score: number; isCorrect: boolean } {
  if (!Array.isArray(candidate) || !Array.isArray(correct)) {
    return { score: 0, isCorrect: false };
  }

  const totalItems = correct.length;
  if (totalItems === 0) return { score: 0, isCorrect: false };

  let correctCount = 0;
  for (let i = 0; i < totalItems; i++) {
    if (String(candidate[i]) === String(correct[i])) {
      correctCount++;
    }
  }

  const isCorrect = correctCount === totalItems;
  const score = (correctCount / totalItems) * maxScore;
  return { score: Math.round(score * 100) / 100, isCorrect };
}

// ─── Fill-in-blank: compare text, case-insensitive ──────────────────

function gradeFillInBlank(
  candidate: unknown,
  correct: unknown,
  maxScore: number
): { score: number; isCorrect: boolean } {
  // Support single blank or multiple blanks
  if (Array.isArray(candidate) && Array.isArray(correct)) {
    const total = correct.length;
    if (total === 0) return { score: 0, isCorrect: false };

    let correctCount = 0;
    for (let i = 0; i < total; i++) {
      const cand = String(candidate[i] ?? "").trim().toLowerCase();
      const corr = correct[i];
      // Support multiple acceptable answers per blank
      const acceptableAnswers = Array.isArray(corr) ? corr : [corr];
      if (acceptableAnswers.some((a: unknown) => String(a).trim().toLowerCase() === cand)) {
        correctCount++;
      }
    }

    const isCorrect = correctCount === total;
    const score = (correctCount / total) * maxScore;
    return { score: Math.round(score * 100) / 100, isCorrect };
  }

  // Single blank
  const candidateStr = String(candidate ?? "").trim().toLowerCase();
  const acceptableAnswers = Array.isArray(correct) ? correct : [correct];
  const isCorrect = acceptableAnswers.some(
    (a: unknown) => String(a).trim().toLowerCase() === candidateStr
  );
  return { score: isCorrect ? maxScore : 0, isCorrect };
}

// ─── Auto-grade entire session ──────────────────────────────────────

export async function autoGradeSession(
  tenantId: string,
  sessionId: string
): Promise<{ gradeId: string; autoGradedCount: number; manualRequired: number }> {
  // 1. Load session with answers and questions
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
    include: {
      examSchedule: {
        include: {
          exam: {
            select: {
              id: true,
              tenantId: true,
              passingScore: true,
              totalPoints: true,
              sections: {
                include: {
                  questions: {
                    include: {
                      question: {
                        select: {
                          id: true,
                          type: true,
                          correctAnswer: true,
                          points: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      answers: true,
    },
  });

  if (!session) throw errors.notFound("ไม่พบ Session");
  if (session.examSchedule.exam.tenantId !== tenantId) {
    throw errors.forbidden("ไม่มีสิทธิ์ดำเนินการ");
  }
  if (session.status !== "SUBMITTED" && session.status !== "TIMED_OUT") {
    throw errors.validation("Session ยังไม่ได้ส่งคำตอบ");
  }

  // 2. Build question map from exam sections
  const questionMap = new Map<
    string,
    { type: string; correctAnswer: Prisma.JsonValue; points: number; overridePoints: number | null }
  >();
  for (const section of session.examSchedule.exam.sections) {
    for (const sq of section.questions) {
      questionMap.set(sq.question.id, {
        type: sq.question.type,
        correctAnswer: sq.question.correctAnswer,
        points: sq.question.points,
        overridePoints: sq.points,
      });
    }
  }

  // 3. Grade each answer
  const autoGradeResults: AutoGradeResult[] = [];
  let manualRequired = 0;

  for (const answer of session.answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;

    const maxScore = question.overridePoints ?? question.points;

    if (AUTO_GRADABLE_TYPES.includes(question.type)) {
      const result = gradeAnswer(
        question.type,
        answer.answer,
        question.correctAnswer,
        maxScore
      );
      autoGradeResults.push({
        answerId: answer.id,
        questionId: answer.questionId,
        score: result.score,
        maxScore,
        isCorrect: result.isCorrect,
        isAutoGraded: true,
      });
    } else {
      // ESSAY, SHORT_ANSWER, IMAGE_BASED → needs manual grading
      manualRequired++;
      autoGradeResults.push({
        answerId: answer.id,
        questionId: answer.questionId,
        score: 0,
        maxScore,
        isCorrect: false,
        isAutoGraded: false,
      });
    }
  }

  // 4. Create Grade + GradeAnswers in transaction
  const exam = session.examSchedule.exam;
  const totalMaxScore = exam.totalPoints;

  const grade = await prisma.$transaction(async (tx) => {
    // Upsert grade (in case auto-grade is re-run)
    const existingGrade = await tx.grade.findUnique({
      where: { sessionId },
    });

    const gradeRecord = existingGrade
      ? await tx.grade.update({
          where: { id: existingGrade.id },
          data: { status: manualRequired > 0 ? "GRADING" : "COMPLETED" },
        })
      : await tx.grade.create({
          data: {
            tenantId,
            sessionId,
            totalScore: 0,
            maxScore: totalMaxScore,
            percentage: 0,
            isPassed: false,
            status: manualRequired > 0 ? "GRADING" : "COMPLETED",
          },
        });

    // Create or update grade answers
    if (!existingGrade) {
      // New grade — batch create all answers in 1 query
      await tx.gradeAnswer.createMany({
        data: autoGradeResults.map((result) => ({
          gradeId: gradeRecord.id,
          answerId: result.answerId,
          score: result.isAutoGraded ? result.score : 0,
          maxScore: result.maxScore,
          isAutoGraded: result.isAutoGraded,
          isCorrect: result.isAutoGraded ? result.isCorrect : null,
        })),
        skipDuplicates: true,
      });
    } else {
      // Re-grade — must upsert individually to preserve manual grades
      for (const result of autoGradeResults) {
        await tx.gradeAnswer.upsert({
          where: { answerId: result.answerId },
          create: {
            gradeId: gradeRecord.id,
            answerId: result.answerId,
            score: result.isAutoGraded ? result.score : 0,
            maxScore: result.maxScore,
            isAutoGraded: result.isAutoGraded,
            isCorrect: result.isAutoGraded ? result.isCorrect : null,
          },
          update: result.isAutoGraded
            ? { score: result.score, isAutoGraded: true, isCorrect: result.isCorrect }
            : { maxScore: result.maxScore },
        });
      }
    }

    // Recalculate totals
    const allGradeAnswers = await tx.gradeAnswer.findMany({
      where: { gradeId: gradeRecord.id },
    });

    const totalScore = allGradeAnswers.reduce((sum, ga) => sum + ga.score, 0);
    const maxScore = allGradeAnswers.reduce((sum, ga) => sum + ga.maxScore, 0);
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const isPassed = percentage >= (exam.passingScore ?? 0);

    const updatedGrade = await tx.grade.update({
      where: { id: gradeRecord.id },
      data: {
        totalScore: Math.round(totalScore * 100) / 100,
        maxScore,
        percentage: Math.round(percentage * 100) / 100,
        isPassed,
        gradedAt: manualRequired === 0 ? new Date() : null,
      },
    });

    return updatedGrade;
  });

  return {
    gradeId: grade.id,
    autoGradedCount: autoGradeResults.filter((r) => r.isAutoGraded).length,
    manualRequired,
  };
}

// ─── Check if a question type is auto-gradable ──────────────────────

export function isAutoGradable(questionType: string): boolean {
  return AUTO_GRADABLE_TYPES.includes(questionType);
}
