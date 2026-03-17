import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getSession } from "@/services/exam-session.service";
import { getEventSummary } from "@/services/anti-cheat.service";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("session:list");
    const { id } = await context.params;

    const includeEvents = request.nextUrl.searchParams.get("includeEvents");

    const examSession = await getSession(session.tenantId, id);

    if (includeEvents === "true") {
      const eventSummary = await getEventSummary(session.tenantId, id);
      return NextResponse.json({
        success: true,
        data: { ...examSession, eventSummary },
      });
    }

    return NextResponse.json({ success: true, data: examSession });
  } catch (error) {
    return handleApiError(error);
  }
}
