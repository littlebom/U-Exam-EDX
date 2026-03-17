import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listVouchers, createVoucher } from "@/services/voucher.service";
import { voucherFilterSchema, createVoucherSchema } from "@/lib/validations/voucher";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("registration:list");
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = voucherFilterSchema.parse(params);
    const result = await listVouchers(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("registration:approve");
    const body = await req.json();
    const data = createVoucherSchema.parse(body);
    const voucher = await createVoucher(session.tenantId, data);

    return NextResponse.json({ success: true, data: voucher }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
