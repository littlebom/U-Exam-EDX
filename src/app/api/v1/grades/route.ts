import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listGrades } from "@/services/grading.service";
import { gradeFilterSchema } from "@/lib/validations/grading";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("grading:list");
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const filters = gradeFilterSchema.parse(params);
    const result = await listGrades(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
