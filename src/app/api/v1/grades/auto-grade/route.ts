import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { autoGradeSession } from "@/services/auto-grading.service";
import { handleApiError } from "@/lib/errors";

// POST — Auto-grade a session
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("grading:grade");
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "sessionId is required" } },
        { status: 422 }
      );
    }

    const result = await autoGradeSession(session.tenantId, sessionId);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
