import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getTodaySchedules } from "@/services/checkin.service";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await requirePermission("session:manage");
    const schedules = await getTodaySchedules(session.tenantId);

    return NextResponse.json({ success: true, data: schedules });
  } catch (error) {
    return handleApiError(error);
  }
}
