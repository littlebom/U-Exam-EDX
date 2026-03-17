import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { applyCoupon } from "@/services/coupon.service";
import { applyCouponSchema } from "@/lib/validations/payment";
import { handleApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("registration:list");
    const body = await req.json();
    const data = applyCouponSchema.parse(body);
    const result = await applyCoupon(session.tenantId, data);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
