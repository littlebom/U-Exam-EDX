import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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
import { handleApiError, AppError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

// GET — list answers for a session
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { id } = await context.params;
    const answers = await getSessionAnswers(id, session.user.id);

    return NextResponse.json({ success: true, data: answers });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT — submit single answer or flag question
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { id } = await context.params;
    const body = await request.json();

    // Determine action type
    if ("isFlagged" in body) {
      const parsed = flagQuestionSchema.parse(body);
      const result = await flagQuestion(id, session.user.id, parsed);
      return NextResponse.json({ success: true, data: result });
    }

    const parsed = submitAnswerSchema.parse(body);
    const result = await submitAnswer(id, session.user.id, parsed);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST — auto-save batch answers
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = autoSaveSchema.parse(body);
    const result = await autoSave(id, session.user.id, parsed);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
