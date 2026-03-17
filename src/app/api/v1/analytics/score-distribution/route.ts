import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getScoreDistribution } from "@/services/analytics.service";
import { scoreDistributionFilterSchema } from "@/lib/validations/analytics";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("analytics:view");
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = scoreDistributionFilterSchema.parse(params);
    const data = await getScoreDistribution(session.tenantId, filters);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}
