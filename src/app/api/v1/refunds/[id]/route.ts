import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { processRefund } from "@/services/refund.service";
import { processRefundSchema } from "@/lib/validations/payment";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("payment:refund");
    const { id } = await context.params;
    const body = await req.json();
    const { status } = processRefundSchema.parse(body);
    const refund = await processRefund(
      session.tenantId,
      id,
      status,
      session.userId
    );

    return NextResponse.json({ success: true, data: refund });
  } catch (error) {
    return handleApiError(error);
  }
}
