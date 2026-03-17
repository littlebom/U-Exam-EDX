import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getCenterOverview } from "@/services/center-analytics.service";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await requirePermission("center:list");
    const overview = await getCenterOverview(session.tenantId);

    return NextResponse.json({ success: true, data: overview });
  } catch (error) {
    return handleApiError(error);
  }
}
