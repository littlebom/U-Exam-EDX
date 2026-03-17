import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type { PaginationMeta } from "@/types";
import type { Prisma } from "@/generated/prisma";
import type {
  StartSessionInput,
  SubmitAnswerInput,
  FlagQuestionInput,
  AutoSaveInput,
  SessionFilter,
} from "@/lib/validations/exam-session";

// ─── Shared Includes ────────────────────────────────────────────────

const sessionInclude = {
  examSchedule: {
    include: {
      exam: {
        select: {
          id: true,
          title: true,
          duration: true,
          totalPoints: true,
          passingScore: true,
          settings: true,
          sections: {
            orderBy: { sortOrder: "asc" as const },
            include: {
              questions: {
                orderBy: { sortOrder: "asc" as const },
                include: {
                  question: {
                    select: {
                      id: true,
                      type: true,
                      content: true,
                      options: true,
                      points: true,
                      difficulty: true,
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
  candidate: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.ExamSessionInclude;

const sessionListInclude = {
  examSchedule: {
    include: {
      exam: {
        select: { id: true, title: true, duration: true },
      },
    },
  },
  candidate: {
    select: { id: true, name: true, email: true },
  },
  _count: {
    select: { answers: true, events: true },
  },
} satisfies Prisma.ExamSessionInclude;

// ─── List Sessions ──────────────────────────────────────────────────

export async function listSessions(
  tenantId: string,
  filters: SessionFilter
) {
  const { examScheduleId, candidateId, status, page, perPage } = filters;

  const where: Prisma.ExamSessionWhereInput = {
    examSchedule: { tenantId },
    ...(examScheduleId && { examScheduleId }),
    ...(candidateId && { candidateId }),
    ...(status && { status }),
  };

  const [data, total] = await Promise.all([
    prisma.examSession.findMany({
      where,
      include: sessionListInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.examSession.count({ where }),
  ]);

  const meta: PaginationMeta = {
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage),
  };

  return { data, meta };
}

// ─── Get Session ────────────────────────────────────────────────────

export async function getSession(tenantId: string, sessionId: string) {
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
    include: sessionInclude,
  });

  if (!session || session.examSchedule.tenantId !== tenantId) {
    throw errors.notFound("ไม่พบข้อมูลเซสชันสอบ");
  }

  return session;
}

// ─── Get Session for Candidate ──────────────────────────────────────

export async function getSessionForCandidate(
  sessionId: string,
  candidateId: string
) {
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
    include: sessionInclude,
  });

  if (!session || session.candidateId !== candidateId) {
    throw errors.notFound("ไม่พบข้อมูลเซสชันสอบ");
  }

  return session;
}

// ─── Start Exam ─────────────────────────────────────────────────────

export async function startExam(
  candidateId: string,
  data: StartSessionInput
) {
  // Check schedule exists and is ACTIVE
  const schedule = await prisma.examSchedule.findUnique({
    where: { id: data.examScheduleId },
    include: {
      exam: {
        select: { id: true, duration: true, status: true },
      },
    },
  });

  if (!schedule) {
    throw errors.notFound("ไม่พบตารางสอบ");
  }

  if (schedule.status !== "ACTIVE") {
    throw errors.validation("ตารางสอบยังไม่เปิดรับการสอบ");
  }

  if (schedule.exam.status !== "PUBLISHED" && schedule.exam.status !== "ACTIVE") {
    throw errors.validation("ชุดสอบยังไม่พร้อมใช้งาน");
  }

  // Check if already has a session
  const existing = await prisma.examSession.findUnique({
    where: {
      examScheduleId_candidateId: {
        examScheduleId: data.examScheduleId,
        candidateId,
      },
    },
  });

  if (existing) {
    if (existing.status === "IN_PROGRESS") {
      // Resume existing session
      return getSessionForCandidate(existing.id, candidateId);
    }
    if (existing.status === "SUBMITTED" || existing.status === "TIMED_OUT") {
      throw errors.conflict("คุณได้ทำข้อสอบนี้แล้ว");
    }
  }

  // Check max candidates
  if (schedule.maxCandidates) {
    const currentCount = await prisma.examSession.count({
      where: { examScheduleId: data.examScheduleId },
    });
    if (currentCount >= schedule.maxCandidates) {
      throw errors.validation("จำนวนผู้สอบเต็มแล้ว");
    }
  }

  // Create or update session
  const session = existing
    ? await prisma.examSession.update({
        where: { id: existing.id },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
          timeRemaining: schedule.exam.duration * 60,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      })
    : await prisma.examSession.create({
        data: {
          examScheduleId: data.examScheduleId,
          candidateId,
          status: "IN_PROGRESS",
          startedAt: new Date(),
          timeRemaining: schedule.exam.duration * 60,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });

  return getSessionForCandidate(session.id, candidateId);
}

// ─── Submit Answer ──────────────────────────────────────────────────

export async function submitAnswer(
  sessionId: string,
  candidateId: string,
  data: SubmitAnswerInput
) {
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.candidateId !== candidateId) {
    throw errors.notFound("ไม่พบข้อมูลเซสชันสอบ");
  }

  if (session.status !== "IN_PROGRESS") {
    throw errors.validation("เซสชันสอบไม่อยู่ในสถานะทำข้อสอบ");
  }

  const answer = await prisma.examAnswer.upsert({
    where: {
      sessionId_questionId: {
        sessionId,
        questionId: data.questionId,
      },
    },
    update: {
      answer: data.answer as Prisma.InputJsonValue ?? undefined,
      answeredAt: new Date(),
      timeSpent: data.timeSpent,
    },
    create: {
      sessionId,
      questionId: data.questionId,
      answer: data.answer as Prisma.InputJsonValue ?? undefined,
      answeredAt: new Date(),
      timeSpent: data.timeSpent,
    },
  });

  return answer;
}

// ─── Flag Question ──────────────────────────────────────────────────

export async function flagQuestion(
  sessionId: string,
  candidateId: string,
  data: FlagQuestionInput
) {
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.candidateId !== candidateId) {
    throw errors.notFound("ไม่พบข้อมูลเซสชันสอบ");
  }

  if (session.status !== "IN_PROGRESS") {
    throw errors.validation("เซสชันสอบไม่อยู่ในสถานะทำข้อสอบ");
  }

  const answer = await prisma.examAnswer.upsert({
    where: {
      sessionId_questionId: {
        sessionId,
        questionId: data.questionId,
      },
    },
    update: {
      isFlagged: data.isFlagged,
    },
    create: {
      sessionId,
      questionId: data.questionId,
      isFlagged: data.isFlagged,
    },
  });

  return answer;
}

// ─── Auto-save (batch) ──────────────────────────────────────────────

export async function autoSave(
  sessionId: string,
  candidateId: string,
  data: AutoSaveInput
) {
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.candidateId !== candidateId) {
    throw errors.notFound("ไม่พบข้อมูลเซสชันสอบ");
  }

  if (session.status !== "IN_PROGRESS") {
    throw errors.validation("เซสชันสอบไม่อยู่ในสถานะทำข้อสอบ");
  }

  await prisma.$transaction(async (tx) => {
    // Update time remaining
    if (data.timeRemaining !== undefined) {
      await tx.examSession.update({
        where: { id: sessionId },
        data: { timeRemaining: data.timeRemaining },
      });
    }

    // Upsert answers
    for (const ans of data.answers) {
      await tx.examAnswer.upsert({
        where: {
          sessionId_questionId: {
            sessionId,
            questionId: ans.questionId,
          },
        },
        update: {
          answer: ans.answer as Prisma.InputJsonValue ?? undefined,
          answeredAt: new Date(),
          timeSpent: ans.timeSpent,
        },
        create: {
          sessionId,
          questionId: ans.questionId,
          answer: ans.answer as Prisma.InputJsonValue ?? undefined,
          answeredAt: new Date(),
          timeSpent: ans.timeSpent,
        },
      });
    }
  });

  return { success: true };
}

// ─── Submit Exam ────────────────────────────────────────────────────

export async function submitExam(sessionId: string, candidateId: string) {
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.candidateId !== candidateId) {
    throw errors.notFound("ไม่พบข้อมูลเซสชันสอบ");
  }

  if (session.status !== "IN_PROGRESS") {
    throw errors.validation("เซสชันสอบไม่อยู่ในสถานะทำข้อสอบ");
  }

  const updated = await prisma.examSession.update({
    where: { id: sessionId },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      timeRemaining: 0,
    },
    include: sessionListInclude,
  });

  return updated;
}

// ─── Timeout Exam ───────────────────────────────────────────────────

export async function timeoutExam(sessionId: string) {
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw errors.notFound("ไม่พบข้อมูลเซสชันสอบ");
  }

  if (session.status !== "IN_PROGRESS") {
    return session;
  }

  const updated = await prisma.examSession.update({
    where: { id: sessionId },
    data: {
      status: "TIMED_OUT",
      submittedAt: new Date(),
      timeRemaining: 0,
    },
  });

  return updated;
}

// ─── Get Session Status ─────────────────────────────────────────────

export async function getSessionStatus(
  sessionId: string,
  candidateId: string
) {
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      status: true,
      startedAt: true,
      submittedAt: true,
      timeRemaining: true,
      _count: { select: { answers: true, events: true } },
    },
  });

  if (!session) {
    throw errors.notFound("ไม่พบข้อมูลเซสชันสอบ");
  }

  return session;
}

// ─── Get Answers for Session ────────────────────────────────────────

export async function getSessionAnswers(
  sessionId: string,
  candidateId: string
) {
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.candidateId !== candidateId) {
    throw errors.notFound("ไม่พบข้อมูลเซสชันสอบ");
  }

  const answers = await prisma.examAnswer.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  return answers;
}
