import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import {
  getSubject,
  updateSubject,
  deleteSubject,
} from "@/services/subject.service";
import { updateSubjectSchema } from "@/lib/validations/subject";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("question:list");
    const { id } = await context.params;
    const subject = await getSubject(session.tenantId, id);

    return NextResponse.json({ success: true, data: subject });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("question:update");
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateSubjectSchema.parse({ ...body, id });
    const { id: _id, ...rest } = parsed;
    const subject = await updateSubject(session.tenantId, id, rest);

    return NextResponse.json({ success: true, data: subject });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("question:delete");
    const { id } = await context.params;
    await deleteSubject(session.tenantId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
