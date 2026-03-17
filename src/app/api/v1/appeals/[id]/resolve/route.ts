import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { resolveAppeal } from "@/services/appeal.service";
import { resolveAppealSchema } from "@/lib/validations/grading";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

// POST — Resolve appeal (approve/reject)
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("grading:appeal");
    const { id: appealId } = await context.params;
    const body = await request.json();
    const parsed = resolveAppealSchema.parse(body);
    const result = await resolveAppeal(session.tenantId, appealId, session.userId, parsed);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
