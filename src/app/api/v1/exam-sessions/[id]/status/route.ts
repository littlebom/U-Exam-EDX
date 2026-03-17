import { NextRequest, NextResponse } from "next/server";
import { getSessionTenant } from "@/lib/get-session";
import { getSessionStatus } from "@/services/exam-session.service";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getSessionTenant();
    const { id } = await context.params;
    const result = await getSessionStatus(id, session.userId);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
