import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listQuestions, createQuestion } from "@/services/question.service";
import { questionFilterSchema, createQuestionSchema } from "@/lib/validations/question";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("question:list");
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const filters = questionFilterSchema.parse(params);
    const result = await listQuestions(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("question:create");
    const body = await request.json();
    const parsed = createQuestionSchema.parse(body);

    const { tagIds, ...questionData } = parsed;
    const question = await createQuestion(
      session.tenantId,
      session.userId,
      { ...questionData, tagIds: tagIds ?? [] }
    );

    // Fire-and-forget audit log
    import("@/services/audit-log.service").then(({ logAdminAction }) =>
      logAdminAction("QUESTION_CREATE", {
        userId: session.userId,
        tenantId: session.tenantId,
        target: question.id,
        detail: { type: questionData.type, difficulty: questionData.difficulty },
      })
    ).catch(() => {});

    return NextResponse.json({ success: true, data: question }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
