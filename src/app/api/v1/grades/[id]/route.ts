import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getGrade } from "@/services/grading.service";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("grading:list");
    const { id } = await context.params;
    const grade = await getGrade(session.tenantId, id);

    return NextResponse.json({ success: true, data: grade });
  } catch (error) {
    return handleApiError(error);
  }
}
