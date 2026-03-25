import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listSchedules, createSchedule } from "@/services/exam-schedule.service";
import { scheduleFilterSchema, createScheduleSchema } from "@/lib/validations/exam";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("exam:list");
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const filters = scheduleFilterSchema.parse(params);
    const result = await listSchedules(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("exam:schedule");
    const body = await request.json();
    const parsed = createScheduleSchema.parse(body);

    const schedule = await createSchedule(session.tenantId, parsed);

    const { logAdminAction } = await import("@/services/audit-log.service");
    logAdminAction("SCHEDULE_CREATE", { userId: session.userId, tenantId: session.tenantId, target: schedule.id, detail: { examId: parsed.examId } });

    return NextResponse.json({ success: true, data: schedule }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
