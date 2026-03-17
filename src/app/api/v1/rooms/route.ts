import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listRooms, createRoom } from "@/services/test-center.service";
import { roomFilterSchema, createRoomSchema } from "@/lib/validations/test-center";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("center:list");
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = roomFilterSchema.parse(params);
    const result = await listRooms(session.tenantId, filters);

    return NextResponse.json({ success: true, data: result.data, meta: result.meta });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("center:manage");
    const body = await req.json();
    const data = createRoomSchema.parse(body);
    const room = await createRoom(session.tenantId, data);

    return NextResponse.json({ success: true, data: room }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
