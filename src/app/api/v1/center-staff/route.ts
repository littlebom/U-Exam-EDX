import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listCenterStaff, createCenterStaff } from "@/services/center-staff.service";
import { centerStaffFilterSchema, createCenterStaffSchema } from "@/lib/validations/center-staff";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("center:list");
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = centerStaffFilterSchema.parse(params);
    const result = await listCenterStaff(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("center:manage");
    const body = await req.json();
    const data = createCenterStaffSchema.parse(body);
    const staff = await createCenterStaff(session.tenantId, data);

    return NextResponse.json({ success: true, data: staff }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
