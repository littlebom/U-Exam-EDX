import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import {
  listQuestionGroups,
  createQuestionGroup,
} from "@/services/question-group.service";
import { createQuestionGroupSchema } from "@/lib/validations/question-group";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("question:list");
    const { id: subjectId } = await context.params;
    const groups = await listQuestionGroups(session.tenantId, subjectId);

    return NextResponse.json({ success: true, data: groups });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("question:create");
    const { id: subjectId } = await context.params;
    const body = await request.json();
    const parsed = createQuestionGroupSchema.parse({ ...body, subjectId });
    const group = await createQuestionGroup(session.tenantId, parsed);

    return NextResponse.json({ success: true, data: group }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
