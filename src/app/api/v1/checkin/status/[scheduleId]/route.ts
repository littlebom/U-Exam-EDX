import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getCheckInStatus } from "@/services/checkin.service";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ scheduleId: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("session:manage");
    const { scheduleId } = await context.params;
    const result = await getCheckInStatus(session.tenantId, scheduleId);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        staff: {
          id: session.userId,
          name: session.userName ?? "เจ้าหน้าที่",
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
