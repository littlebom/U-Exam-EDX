import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import {
  getQuestionGroup,
  updateQuestionGroup,
  deleteQuestionGroup,
} from "@/services/question-group.service";
import { updateQuestionGroupSchema } from "@/lib/validations/question-group";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string; groupId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("question:list");
    const { groupId } = await context.params;
    const group = await getQuestionGroup(session.tenantId, groupId);

    return NextResponse.json({ success: true, data: group });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("question:update");
    const { groupId } = await context.params;
    const body = await request.json();
    const parsed = updateQuestionGroupSchema.parse({ ...body, id: groupId });
    const { id: _id, ...rest } = parsed;
    const group = await updateQuestionGroup(session.tenantId, groupId, rest);

    return NextResponse.json({ success: true, data: group });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("question:delete");
    const { groupId } = await context.params;
    await deleteQuestionGroup(session.tenantId, groupId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
