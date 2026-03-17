import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { publishGrade } from "@/services/grading.service";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

// POST — Publish grade
export async function POST(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("grading:approve");
    const { id: gradeId } = await context.params;
    const result = await publishGrade(session.tenantId, gradeId);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
