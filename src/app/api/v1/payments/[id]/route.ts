import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getPayment, processPayment } from "@/services/payment.service";
import { processPaymentSchema } from "@/lib/validations/payment";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("payment:list");
    const { id } = await context.params;
    const payment = await getPayment(session.tenantId, id);

    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("payment:list");
    const { id } = await context.params;
    const body = await req.json();
    const data = processPaymentSchema.parse(body);
    const payment = await processPayment(session.tenantId, id, data);

    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    return handleApiError(error);
  }
}
