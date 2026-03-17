import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listStaffShifts, createStaffShift } from "@/services/center-staff.service";
import { staffShiftFilterSchema, createStaffShiftSchema } from "@/lib/validations/center-staff";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("center:list");
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = staffShiftFilterSchema.parse(params);
    const result = await listStaffShifts(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("center:manage");
    const body = await req.json();
    const data = createStaffShiftSchema.parse(body);
    const shift = await createStaffShift(session.tenantId, data);

    return NextResponse.json({ success: true, data: shift }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
