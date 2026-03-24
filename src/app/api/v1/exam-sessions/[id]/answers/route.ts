import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import {
  submitAnswer,
  flagQuestion,
  autoSave,
  getSessionAnswers,
} from "@/services/exam-session.service";
import {
  submitAnswerSchema,
  flagQuestionSchema,
  autoSaveSchema,
} from "@/lib/validations/exam-session";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

// GET — list answers for a session
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("exam:manage");
    const { id } = await context.params;
    const answers = await getSessionAnswers(id, session.userId);

    return NextResponse.json({ success: true, data: answers });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT — submit single answer or flag question
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("exam:manage");
    const { id } = await context.params;
    const body = await request.json();

    // Determine action type
    if ("isFlagged" in body) {
      const parsed = flagQuestionSchema.parse(body);
      const result = await flagQuestion(id, session.userId, parsed);
      return NextResponse.json({ success: true, data: result });
    }

    const parsed = submitAnswerSchema.parse(body);
    const result = await submitAnswer(id, session.userId, parsed);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST — auto-save batch answers
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("exam:manage");
    const { id } = await context.params;
    const body = await request.json();
    const parsed = autoSaveSchema.parse(body);
    const result = await autoSave(id, session.userId, parsed);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
