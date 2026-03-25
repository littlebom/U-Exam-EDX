import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import {
  getSchedule,
  updateSchedule,
  deleteSchedule,
} from "@/services/exam-schedule.service";
import { updateScheduleSchema } from "@/lib/validations/exam";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("exam:list");
    const { id } = await context.params;
    const schedule = await getSchedule(session.tenantId, id);

    return NextResponse.json({ success: true, data: schedule });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("exam:schedule");
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateScheduleSchema.parse(body);
    const schedule = await updateSchedule(session.tenantId, id, parsed);

    const { logAdminAction } = await import("@/services/audit-log.service");
    logAdminAction("SCHEDULE_UPDATE", { userId: session.userId, tenantId: session.tenantId, target: id });

    return NextResponse.json({ success: true, data: schedule });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("exam:schedule");
    const { id } = await context.params;
    await deleteSchedule(session.tenantId, id);

    const { logAdminAction } = await import("@/services/audit-log.service");
    logAdminAction("SCHEDULE_UPDATE", { userId: session.userId, tenantId: session.tenantId, target: id, detail: { action: "delete" } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
