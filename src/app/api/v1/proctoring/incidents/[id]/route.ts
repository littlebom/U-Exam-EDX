import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { resolveIncident } from "@/services/proctoring.service";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const resolveSchema = z.object({
  resolution: z.string().min(1, "กรุณาระบุรายละเอียดการแก้ไข"),
});

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    await requirePermission("proctoring:incident");
    const { id } = await context.params;
    const body = await req.json();
    const { resolution } = resolveSchema.parse(body);

    const result = await resolveIncident(id, resolution);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
