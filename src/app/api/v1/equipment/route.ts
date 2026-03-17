import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listEquipment, createEquipment } from "@/services/seat-equipment.service";
import { equipmentFilterSchema, createEquipmentSchema } from "@/lib/validations/seat-equipment";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("center:list");
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = equipmentFilterSchema.parse(params);
    const result = await listEquipment(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("center:manage");
    const body = await req.json();
    const data = createEquipmentSchema.parse(body);
    const equipment = await createEquipment(session.tenantId, data);

    return NextResponse.json({ success: true, data: equipment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
