import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getTodaySchedules } from "@/services/checkin.service";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("session:manage");
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";

    if (all) {
      // Return all ACTIVE/COMPLETED schedules (for Logs page)
      const schedules = await prisma.examSchedule.findMany({
        where: {
          tenantId: session.tenantId,
          status: { in: ["SCHEDULED", "ACTIVE", "COMPLETED"] },
        },
        include: {
          exam: { select: { id: true, title: true } },
          _count: {
            select: { registrations: { where: { status: "CONFIRMED" } } },
          },
        },
        orderBy: { startDate: "desc" },
        take: 50,
      });

      const data = schedules.map((s) => ({
        id: s.id,
        examTitle: s.exam.title,
        startDate: s.startDate.toISOString(),
        registrationCount: s._count.registrations,
      }));

      return NextResponse.json({ success: true, data });
    }

    // Default: today's schedules only
    const schedules = await getTodaySchedules(session.tenantId);
    return NextResponse.json({ success: true, data: schedules });
  } catch (error) {
    return handleApiError(error);
  }
}
