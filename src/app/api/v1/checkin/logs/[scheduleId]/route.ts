import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getExamDayLogs } from "@/services/checkin.service";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ scheduleId: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("session:manage");
    const { scheduleId } = await context.params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? undefined;

    const logs = await getExamDayLogs(session.tenantId, scheduleId, type);

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    return handleApiError(error);
  }
}
