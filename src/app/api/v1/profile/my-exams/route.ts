import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { resolveProctoringSettings } from "@/lib/resolve-proctoring";

// GET — list candidate's upcoming exams (confirmed registrations)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const userId = session.user.id;
    const now = new Date();

    // Fetch confirmed registrations with active/upcoming schedules
    const registrations = await prisma.registration.findMany({
      where: {
        candidateId: userId,
        status: "CONFIRMED",
        examSchedule: {
          status: { in: ["SCHEDULED", "ACTIVE"] },
          endDate: { gte: now },
        },
      },
      include: {
        examSchedule: {
          include: {
            exam: {
              select: {
                id: true,
                title: true,
                duration: true,
                totalPoints: true,
                passingScore: true,
                mode: true,
              },
            },
            testCenter: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: {
        examSchedule: { startDate: "asc" },
      },
    });

    // Fetch exam sessions for these schedules
    const scheduleIds = registrations.map((r) => r.examScheduleId);
    const examSessions = await prisma.examSession.findMany({
      where: {
        candidateId: userId,
        examScheduleId: { in: scheduleIds },
      },
      select: {
        examScheduleId: true,
        status: true,
        id: true,
      },
    });

    const sessionMap = new Map(
      examSessions.map((s) => [s.examScheduleId, s])
    );

    // Get user face image status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { imageUrl: true },
    });

    // Map to response
    const items = registrations.map((reg) => {
      const schedule = reg.examSchedule;
      const examSession = sessionMap.get(schedule.id);
      const examType = (schedule as unknown as Record<string, string>).examType ?? "ONSITE";
      const isOnline = examType === "ONLINE";
      const isWithinTimeWindow =
        now >= schedule.startDate && now <= schedule.endDate;

      const canStartExam =
        isWithinTimeWindow &&
        schedule.status === "ACTIVE" &&
        (!examSession ||
          examSession.status === "IN_PROGRESS" ||
          !["SUBMITTED", "TIMED_OUT"].includes(examSession.status));

      // Check if face verify is required from schedule settings
      const settings = schedule.settings as Record<string, unknown> | null;
      const checkinSettings = settings?.checkin as Record<string, unknown> | undefined;
      const requireFaceVerify = !!(checkinSettings?.requireFaceVerify);

      // Resolve proctoring from schedule settings
      const proctoringSettings = resolveProctoringSettings(settings);

      return {
        registrationId: reg.id,
        scheduleId: schedule.id,
        examTitle: schedule.exam.title,
        examMode: schedule.exam.mode,
        duration: schedule.exam.duration,
        totalPoints: schedule.exam.totalPoints,
        passingScore: schedule.exam.passingScore,
        startDate: schedule.startDate.toISOString(),
        endDate: schedule.endDate.toISOString(),
        isOnline,
        testCenterName: schedule.testCenter?.name ?? null,
        examSessionStatus: examSession?.status ?? null,
        examSessionId: examSession?.id ?? null,
        canStartExam,
        isWithinTimeWindow,
        requireFaceVerify,
        proctoring: proctoringSettings,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        hasFaceImage: !!user?.imageUrl,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
