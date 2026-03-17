import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getExamForBuilder } from "@/services/exam.service";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("exam:list");
    const { id } = await context.params;
    const exam = await getExamForBuilder(session.tenantId, id);

    return NextResponse.json({ success: true, data: exam });
  } catch (error) {
    return handleApiError(error);
  }
}
