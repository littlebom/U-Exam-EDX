import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listAppeals, createAppeal } from "@/services/appeal.service";
import { appealFilterSchema, createAppealSchema } from "@/lib/validations/grading";
import { handleApiError } from "@/lib/errors";
import { getSessionTenant } from "@/lib/get-session";

// GET — List appeals (admin/grader)
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("grading:appeal");
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const filters = appealFilterSchema.parse(params);
    const result = await listAppeals(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST — Create appeal (candidate)
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionTenant();
    const body = await request.json();
    const parsed = createAppealSchema.parse(body);
    const result = await createAppeal(session.tenantId, session.userId, parsed);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
