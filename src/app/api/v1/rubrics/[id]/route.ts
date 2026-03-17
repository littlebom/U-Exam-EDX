import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getRubric, updateRubric, deleteRubric } from "@/services/grading.service";
import { updateRubricSchema } from "@/lib/validations/grading";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

// GET — Get rubric detail
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("grading:list");
    const { id } = await context.params;
    const rubric = await getRubric(session.tenantId, id);

    return NextResponse.json({ success: true, data: rubric });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT — Update rubric
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("grading:grade");
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateRubricSchema.parse(body);
    const result = await updateRubric(session.tenantId, id, parsed);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE — Delete rubric
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("grading:grade");
    const { id } = await context.params;
    await deleteRubric(session.tenantId, id);

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleApiError(error);
  }
}
