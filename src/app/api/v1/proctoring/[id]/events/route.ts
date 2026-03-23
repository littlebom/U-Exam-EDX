import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { logProctoringEvent, getProctoringEvents } from "@/services/proctoring.service";
import { handleApiError } from "@/lib/errors";
import { logProctoringEventSchema } from "@/lib/validations/proctoring";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    await requirePermission("proctoring:monitor");
    const { id } = await context.params;
    const url = new URL(req.url);

    const result = await getProctoringEvents(id, {
      type: url.searchParams.get("type") ?? undefined,
      severity: url.searchParams.get("severity") ?? undefined,
      page: parseInt(url.searchParams.get("page") ?? "1", 10),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

// Schema imported from @/lib/validations/proctoring

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    await requirePermission("proctoring:monitor");
    const { id } = await context.params;
    const body = await req.json();
    const data = logProctoringEventSchema.parse(body);

    const result = await logProctoringEvent(id, data);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
