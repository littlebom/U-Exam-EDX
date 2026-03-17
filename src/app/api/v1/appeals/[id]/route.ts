import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getAppeal } from "@/services/appeal.service";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

// GET — Get appeal detail
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("grading:appeal");
    const { id } = await context.params;
    const appeal = await getAppeal(session.tenantId, id);

    return NextResponse.json({ success: true, data: appeal });
  } catch (error) {
    return handleApiError(error);
  }
}
