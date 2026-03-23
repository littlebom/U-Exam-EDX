import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";

// GET /api/v1/exams/tracking — รายการรอบสอบที่เปิดอยู่ + สถิติผู้สอบ
export async function GET() {
  try {
    const ctx = await requirePermission("exam:list");

    const schedules = await prisma.examSchedule.findMany({
      where: {
        exam: { tenantId: ctx.tenantId },
        status: { in: ["ACTIVE", "COMPLETED"] },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
        maxCandidates: true,
        exam: { select: { id: true, title: true } },
        testCenter: { select: { id: true, name: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { startDate: "desc" },
      take: 50,
    });

    // Batch fetch session stats per schedule
    const scheduleIds = schedules.map((s) => s.id);

    const sessionStats = scheduleIds.length > 0
      ? await prisma.examSession.groupBy({
          by: ["examScheduleId", "status"],
          where: { examScheduleId: { in: scheduleIds } },
          _count: true,
        })
      : [];

    // Build stats map: scheduleId → { IN_PROGRESS, SUBMITTED, TIMED_OUT }
    const statsMap = new Map<string, Record<string, number>>();
    for (const row of sessionStats) {
      if (!statsMap.has(row.examScheduleId)) statsMap.set(row.examScheduleId, {});
      statsMap.get(row.examScheduleId)![row.status] = row._count;
    }

    const data = schedules.map((s) => {
      const stats = statsMap.get(s.id) ?? {};
      const registered = s._count.registrations;
      const inProgress = stats["IN_PROGRESS"] ?? 0;
      const submitted = (stats["SUBMITTED"] ?? 0) + (stats["TIMED_OUT"] ?? 0);
      const totalStarted = inProgress + submitted;
      const absent = Math.max(0, registered - totalStarted);

      return {
        id: s.id,
        examTitle: s.exam.title,
        examId: s.exam.id,
        startDate: s.startDate,
        endDate: s.endDate,
        status: s.status,
        testCenterName: s.testCenter?.name ?? null,
        maxCandidates: s.maxCandidates,
        registered,
        inProgress,
        submitted,
        absent,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}
