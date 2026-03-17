import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logEvent, logEvents } from "@/services/anti-cheat.service";
import {
  logEventSchema,
  logEventsSchema,
} from "@/lib/validations/exam-session";
import { handleApiError, AppError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

// POST — log anti-cheat event(s) from candidate
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { id } = await context.params;
    const body = await request.json();

    // Support both single event and batch events
    if ("events" in body) {
      const parsed = logEventsSchema.parse(body);
      const result = await logEvents(id, session.user.id, parsed);
      return NextResponse.json({ success: true, data: result });
    }

    const parsed = logEventSchema.parse(body);
    const result = await logEvent(id, session.user.id, parsed);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
