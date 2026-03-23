import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { resolveIncident } from "@/services/proctoring.service";
import { handleApiError } from "@/lib/errors";
import { resolveIncidentSchema } from "@/lib/validations/proctoring";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    await requirePermission("proctoring:incident");
    const { id } = await context.params;
    const body = await req.json();
    const { resolution } = resolveIncidentSchema.parse(body);

    const result = await resolveIncident(id, resolution);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
