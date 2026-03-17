import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getAppealStats } from "@/services/appeal.service";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await requirePermission("grading:appeal");
    const stats = await getAppealStats(session.tenantId);

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return handleApiError(error);
  }
}
