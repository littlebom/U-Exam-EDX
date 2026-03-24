import { NextRequest, NextResponse } from "next/server";
import { getSessionTenant } from "@/lib/get-session";
import { requirePermission } from "@/lib/rbac";
import { logEvent, logEvents, getEvents } from "@/services/anti-cheat.service";
import {
  logEventSchema,
  logEventsSchema,
} from "@/lib/validations/exam-session";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

// GET — list events (admin/proctor)
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("session:manage");
    const { id } = await context.params;
    const events = await getEvents(session.tenantId, id);

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST — log event(s) from candidate
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await requirePermission("session:manage");
    const { id } = await context.params;
    const body = await request.json();

    // Support both single event and batch events
    if ("events" in body) {
      const parsed = logEventsSchema.parse(body);
      const result = await logEvents(id, session.userId, parsed);
      return NextResponse.json({ success: true, data: result });
    }

    const parsed = logEventSchema.parse(body);
    const result = await logEvent(id, session.userId, parsed);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
