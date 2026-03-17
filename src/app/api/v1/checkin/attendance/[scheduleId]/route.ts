import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getAttendanceList } from "@/services/checkin.service";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ scheduleId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  try {
    const session = await requirePermission("session:manage");
    const { scheduleId } = await context.params;
    const attendance = await getAttendanceList(session.tenantId, scheduleId);

    return NextResponse.json({ success: true, data: attendance });
  } catch (error) {
    return handleApiError(error);
  }
}
