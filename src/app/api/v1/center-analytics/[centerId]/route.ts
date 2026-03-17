import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import {
  getCenterUtilization,
  getCenterExamHistory,
  getCenterStaffPerformance,
} from "@/services/center-analytics.service";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ centerId: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("center:list");
    const { centerId } = await context.params;

    const [utilization, examHistory, staffPerformance] = await Promise.all([
      getCenterUtilization(session.tenantId, centerId),
      getCenterExamHistory(session.tenantId, centerId),
      getCenterStaffPerformance(session.tenantId, centerId),
    ]);

    return NextResponse.json({
      success: true,
      data: { utilization, examHistory, staffPerformance },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
