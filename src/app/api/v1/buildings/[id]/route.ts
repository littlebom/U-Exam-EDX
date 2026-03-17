import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getBuilding, updateBuilding, deleteBuilding } from "@/services/test-center.service";
import { updateBuildingSchema } from "@/lib/validations/test-center";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("center:list");
    const { id } = await context.params;
    const building = await getBuilding(session.tenantId, id);

    return NextResponse.json({ success: true, data: building });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("center:manage");
    const { id } = await context.params;
    const body = await req.json();
    const data = updateBuildingSchema.parse(body);
    const building = await updateBuilding(session.tenantId, id, data);

    return NextResponse.json({ success: true, data: building });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("center:manage");
    const { id } = await context.params;
    await deleteBuilding(session.tenantId, id);

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleApiError(error);
  }
}
