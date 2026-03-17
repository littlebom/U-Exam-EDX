import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listRubrics, createRubric } from "@/services/grading.service";
import { rubricFilterSchema, createRubricSchema } from "@/lib/validations/grading";
import { handleApiError } from "@/lib/errors";

// GET — List rubrics
export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("grading:list");
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const filters = rubricFilterSchema.parse(params);
    const result = await listRubrics(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST — Create rubric
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("grading:grade");
    const body = await request.json();
    const parsed = createRubricSchema.parse(body);
    const result = await createRubric(session.tenantId, parsed);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
