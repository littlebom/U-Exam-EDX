import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { createIncident } from "@/services/proctoring.service";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const incidentSchema = z.object({
  type: z.string().min(1),
  description: z.string().min(1),
  action: z.enum(["WARNING", "PAUSE", "TERMINATE"]),
});

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("proctoring:incident");
    const { id } = await context.params;
    const body = await req.json();
    const data = incidentSchema.parse(body);

    const result = await createIncident(id, data, session.userId);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
