import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getRoom, updateRoom, deleteRoom } from "@/services/test-center.service";
import { updateRoomSchema } from "@/lib/validations/test-center";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("center:list");
    const { id } = await context.params;
    const room = await getRoom(session.tenantId, id);

    return NextResponse.json({ success: true, data: room });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("center:manage");
    const { id } = await context.params;
    const body = await req.json();
    const data = updateRoomSchema.parse(body);
    const room = await updateRoom(session.tenantId, id, data);

    return NextResponse.json({ success: true, data: room });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("center:manage");
    const { id } = await context.params;
    await deleteRoom(session.tenantId, id);

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleApiError(error);
  }
}
