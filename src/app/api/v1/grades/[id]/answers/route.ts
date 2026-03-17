import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { gradeAnswer, batchGrade, adjustScore } from "@/services/grading.service";
import { gradeAnswerSchema, batchGradeSchema, adjustScoreSchema } from "@/lib/validations/grading";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

// PUT — Grade a single answer
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("grading:grade");
    const { id: gradeId } = await context.params;
    const body = await request.json();
    const parsed = gradeAnswerSchema.parse(body);
    const result = await gradeAnswer(session.tenantId, gradeId, session.userId, parsed);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST — Batch grade multiple answers
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("grading:grade");
    const { id: gradeId } = await context.params;
    const body = await request.json();
    const parsed = batchGradeSchema.parse(body);
    const result = await batchGrade(session.tenantId, gradeId, session.userId, parsed);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH — Adjust a score
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("grading:grade");
    const { id: gradeId } = await context.params;
    const body = await request.json();
    const parsed = adjustScoreSchema.parse(body);
    const result = await adjustScore(session.tenantId, gradeId, session.userId, parsed);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
