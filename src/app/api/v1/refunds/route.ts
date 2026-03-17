import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listRefunds, createRefund } from "@/services/refund.service";
import { createRefundSchema } from "@/lib/validations/payment";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("payment:refund");
    const params = req.nextUrl.searchParams;
    const filters = {
      status: params.get("status") || undefined,
      page: parseInt(params.get("page") || "1"),
      perPage: parseInt(params.get("perPage") || "50"),
    };
    const result = await listRefunds(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("payment:refund");
    const body = await req.json();
    const data = createRefundSchema.parse(body);
    const refund = await createRefund(session.tenantId, data);

    return NextResponse.json({ success: true, data: refund }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
