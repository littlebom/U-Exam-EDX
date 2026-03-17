import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getQuestion, updateQuestion, deleteQuestion } from "@/services/question.service";
import { updateQuestionSchema } from "@/lib/validations/question";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("question:list");
    const { id } = await context.params;
    const question = await getQuestion(session.tenantId, id);

    return NextResponse.json({ success: true, data: question });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("question:update");
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateQuestionSchema.parse({ ...body, id });

    const { id: _id, tagIds, media, ...questionData } = parsed;
    const question = await updateQuestion(
      session.tenantId,
      id,
      session.userId,
      { ...questionData, tagIds, media }
    );

    return NextResponse.json({ success: true, data: question });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("question:delete");
    const { id } = await context.params;
    await deleteQuestion(session.tenantId, id, session.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
