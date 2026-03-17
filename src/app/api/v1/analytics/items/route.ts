import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getItemAnalysis } from "@/services/analytics.service";
import { itemAnalysisFilterSchema } from "@/lib/validations/analytics";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("analytics:view");
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = itemAnalysisFilterSchema.parse(params);
    const data = await getItemAnalysis(session.tenantId, filters);

    return NextResponse.json({ success: true, data: data.data, meta: data.meta });
  } catch (error) {
    return handleApiError(error);
  }
}
