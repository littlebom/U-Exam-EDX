import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { submitExam } from "@/services/exam-session.service";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("exam:manage");
    const { id } = await context.params;
    const result = await submitExam(id, session.userId);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
