import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getEquipment, updateEquipment, deleteEquipment } from "@/services/seat-equipment.service";
import { updateEquipmentSchema } from "@/lib/validations/seat-equipment";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await requirePermission("center:list");
    const { id } = await ctx.params;
    const equipment = await getEquipment(session.tenantId, id);

    return NextResponse.json({ success: true, data: equipment });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await requirePermission("center:manage");
    const { id } = await ctx.params;
    const body = await req.json();
    const data = updateEquipmentSchema.parse(body);
    const equipment = await updateEquipment(session.tenantId, id, data);

    return NextResponse.json({ success: true, data: equipment });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await requirePermission("center:manage");
    const { id } = await ctx.params;
    await deleteEquipment(session.tenantId, id);

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleApiError(error);
  }
}
