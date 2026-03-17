import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listCoupons, createCoupon } from "@/services/coupon.service";
import { couponFilterSchema, createCouponSchema } from "@/lib/validations/payment";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("payment:list");
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = couponFilterSchema.parse(params);
    const result = await listCoupons(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("payment:list");
    const body = await req.json();
    const data = createCouponSchema.parse(body);
    const coupon = await createCoupon(session.tenantId, data);

    return NextResponse.json({ success: true, data: coupon }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
