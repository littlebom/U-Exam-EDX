import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { createIncident } from "@/services/proctoring.service";
import { handleApiError } from "@/lib/errors";
import { createIncidentSchema } from "@/lib/validations/proctoring";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("proctoring:incident");
    const { id } = await context.params;
    const body = await req.json();
    const data = createIncidentSchema.parse(body);

    const result = await createIncident(id, data, session.userId);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
