import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listSessions } from "@/services/exam-session.service";
import { sessionFilterSchema } from "@/lib/validations/exam-session";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("session:list");
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const filters = sessionFilterSchema.parse(params);
    const result = await listSessions(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
