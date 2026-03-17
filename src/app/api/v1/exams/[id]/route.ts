import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getExam, updateExam, deleteExam } from "@/services/exam.service";
import { updateExamSchema } from "@/lib/validations/exam";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("exam:list");
    const { id } = await context.params;
    const exam = await getExam(session.tenantId, id);

    return NextResponse.json({ success: true, data: exam });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("exam:update");
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateExamSchema.parse(body);
    const exam = await updateExam(session.tenantId, id, parsed);

    return NextResponse.json({ success: true, data: exam });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("exam:delete");
    const { id } = await context.params;
    await deleteExam(session.tenantId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
