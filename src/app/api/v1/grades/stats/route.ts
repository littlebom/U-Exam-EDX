import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getGradingStats } from "@/services/grading.service";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await requirePermission("grading:list");
    const stats = await getGradingStats(session.tenantId);

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return handleApiError(error);
  }
}
