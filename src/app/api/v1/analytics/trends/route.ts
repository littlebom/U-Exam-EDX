import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getMonthlyTrends } from "@/services/analytics.service";
import { trendFilterSchema } from "@/lib/validations/analytics";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("analytics:view");
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = trendFilterSchema.parse(params);
    const data = await getMonthlyTrends(session.tenantId, filters);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}
