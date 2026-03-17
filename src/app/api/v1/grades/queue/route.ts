import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getGradingQueue } from "@/services/grading.service";
import { gradingQueueFilterSchema } from "@/lib/validations/grading";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("grading:grade");
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const filters = gradingQueueFilterSchema.parse(params);
    const result = await getGradingQueue(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
