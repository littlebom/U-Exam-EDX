import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { submitExam } from "@/services/exam-session.service";
import { autoGradeSession } from "@/services/auto-grading.service";
import { sendNotification } from "@/services/notification.service";
import { prisma } from "@/lib/prisma";
import { handleApiError, AppError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

// ─── Fire-and-forget: auto-grade + notify ────────────────────────

async function triggerAutoGrade(sessionId: string) {
  // 1. Get tenantId, candidateId, examTitle from session
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
    select: {
      candidateId: true,
      examSchedule: {
        select: {
          exam: {
            select: {
              tenantId: true,
              title: true,
            },
          },
        },
      },
    },
  });

  if (!session) return;

  const tenantId = session.examSchedule.exam.tenantId;
  const examTitle = session.examSchedule.exam.title;
  const candidateId = session.candidateId;

  // 2. Run auto-grading
  const result = await autoGradeSession(tenantId, sessionId);

  if (result.manualRequired === 0) {
    // 3a. All auto-gradable → publish immediately + notify candidate
    const grade = await prisma.grade.findUnique({
      where: { id: result.gradeId },
    });

    if (grade) {
      await prisma.grade.update({
        where: { id: grade.id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });

      await sendNotification({
        tenantId,
        userId: candidateId,
        type: "RESULT_PUBLISHED",
        title: "ผลสอบของคุณพร้อมแล้ว",
        message: `${examTitle} — คะแนน ${grade.totalScore}/${grade.maxScore} (${grade.isPassed ? "ผ่าน" : "ไม่ผ่าน"})`,
        link: "/profile/results",
      });
    }
  } else {
    // 3b. Has essay/manual → notify graders
    const graders = await prisma.userTenant.findMany({
      where: {
        tenantId,
        role: { name: { in: ["EXAM_CREATOR", "GRADER", "ADMIN", "TENANT_OWNER"] } },
      },
      select: { userId: true },
    });

    for (const grader of graders) {
      await sendNotification({
        tenantId,
        userId: grader.userId,
        type: "GRADING_REQUIRED",
        title: "มีข้อสอบอัตนัยรอตรวจ",
        message: `${examTitle} — ${result.manualRequired} ข้อรอตรวจ`,
        link: "/admin/grading",
      });
    }

    // Also notify candidate that partial results are available
    const grade = await prisma.grade.findUnique({
      where: { id: result.gradeId },
    });

    if (grade) {
      await sendNotification({
        tenantId,
        userId: candidateId,
        type: "RESULT_PUBLISHED",
        title: "ผลสอบเบื้องต้นพร้อมแล้ว",
        message: `${examTitle} — ข้อปรนัย ${result.autoGradedCount} ข้อตรวจแล้ว, รอตรวจอัตนัย ${result.manualRequired} ข้อ`,
        link: "/profile/results",
      });
    }
  }
}

// ─── POST handler ────────────────────────────────────────────────

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { id } = await context.params;
    const result = await submitExam(id, session.user.id);

    // Fire-and-forget: auto-grade + notifications (don't block response)
    triggerAutoGrade(result.id).catch((err) =>
      console.error("[auto-grade] Error:", err)
    );

    // Audit log
    const { logExamEvent } = await import("@/services/audit-log.service");
    logExamEvent("EXAM_SUBMIT", {
      userId: session.user.id,
      target: `ExamSession:${result.id}`,
      detail: { scheduleId: result.examScheduleId },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
