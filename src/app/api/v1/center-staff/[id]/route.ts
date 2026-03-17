import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getCenterStaff, updateCenterStaff, deleteCenterStaff } from "@/services/center-staff.service";
import { updateCenterStaffSchema } from "@/lib/validations/center-staff";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await requirePermission("center:list");
    const { id } = await ctx.params;
    const staff = await getCenterStaff(session.tenantId, id);

    return NextResponse.json({ success: true, data: staff });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await requirePermission("center:manage");
    const { id } = await ctx.params;
    const body = await req.json();
    const data = updateCenterStaffSchema.parse(body);
    const staff = await updateCenterStaff(session.tenantId, id, data);

    return NextResponse.json({ success: true, data: staff });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await requirePermission("center:manage");
    const { id } = await ctx.params;
    await deleteCenterStaff(session.tenantId, id);

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleApiError(error);
  }
}
