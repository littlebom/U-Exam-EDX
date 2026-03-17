import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/errors";
import {
  updateGraderAssignment,
  deleteGraderAssignment,
} from "@/services/grader-assignment.service";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  scope: z.enum(["ALL", "SECTION"]).optional(),
  sectionId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("grading:grade");
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateSchema.parse(body);
    const result = await updateGraderAssignment(session.tenantId, id, parsed);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("grading:grade");
    const { id } = await context.params;
    await deleteGraderAssignment(session.tenantId, id);

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleApiError(error);
  }
}
