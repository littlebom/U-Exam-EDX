import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getPaymentStats } from "@/services/payment.service";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await requirePermission("payment:list");
    const stats = await getPaymentStats(session.tenantId);

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return handleApiError(error);
  }
}
