import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import {
  getActiveProctoringeSessions,
  getActiveSchedulesWithProctoring,
  getSessionsBySchedule,
} from "@/services/proctoring.service";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("proctoring:monitor");
    const url = new URL(req.url);

    // /api/v1/proctoring?view=schedules — list active schedules
    const view = url.searchParams.get("view");
    if (view === "schedules") {
      const schedules = await getActiveSchedulesWithProctoring();
      return NextResponse.json({ success: true, data: schedules });
    }

    // /api/v1/proctoring?scheduleId=xxx — sessions for a schedule
    const scheduleId = url.searchParams.get("scheduleId");
    if (scheduleId) {
      const result = await getSessionsBySchedule(scheduleId, {
        status: url.searchParams.get("status") ?? undefined,
        page: parseInt(url.searchParams.get("page") ?? "1", 10),
        perPage: parseInt(url.searchParams.get("perPage") ?? "50", 10),
      });
      return NextResponse.json({ success: true, ...result });
    }

    // Default — all active sessions (backwards compatible)
    const result = await getActiveProctoringeSessions({
      status: url.searchParams.get("status") ?? undefined,
      page: parseInt(url.searchParams.get("page") ?? "1", 10),
      perPage: parseInt(url.searchParams.get("perPage") ?? "20", 10),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
