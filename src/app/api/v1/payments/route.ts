import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listPayments, createPayment } from "@/services/payment.service";
import { paymentFilterSchema, createPaymentSchema } from "@/lib/validations/payment";
import { handleApiError } from "@/lib/errors";
import { createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 5 });

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("payment:list");
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = paymentFilterSchema.parse(params);
    const result = await listPayments(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const rl = limiter.check(req);
  if (!rl.success) return rl.response!;

  try {
    const session = await requirePermission("payment:create");
    const body = await req.json();
    const data = createPaymentSchema.parse(body);
    const payment = await createPayment(session.tenantId, data);

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
