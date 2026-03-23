// Admin/internal route — candidates should use /api/v1/profile/exam-sessions/[id]/start
import { NextRequest, NextResponse } from "next/server";
import { getSessionTenant } from "@/lib/get-session";
import { startExam } from "@/services/exam-session.service";
import { startSessionSchema } from "@/lib/validations/exam-session";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSessionTenant();
    const { id } = await context.params;

    const result = await startExam(session.userId, {
      examScheduleId: id,
      ipAddress:
        request.headers.get("x-forwarded-for") ??
        request.headers.get("x-real-ip") ??
        undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
