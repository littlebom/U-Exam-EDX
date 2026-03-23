import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getCoupon, updateCoupon, deleteCoupon } from "@/services/coupon.service";
import { updateCouponSchema } from "@/lib/validations/payment";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("payment:list");
    const { id } = await context.params;
    const coupon = await getCoupon(session.tenantId, id);

    return NextResponse.json({ success: true, data: coupon });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("payment:create");
    const { id } = await context.params;
    const body = await req.json();
    const data = updateCouponSchema.parse(body);
    const coupon = await updateCoupon(session.tenantId, id, data);

    return NextResponse.json({ success: true, data: coupon });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("payment:create");
    const { id } = await context.params;
    await deleteCoupon(session.tenantId, id);

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleApiError(error);
  }
}
