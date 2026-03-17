import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listInvoices } from "@/services/invoice.service";
import { invoiceFilterSchema } from "@/lib/validations/payment";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("payment:invoice");
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = invoiceFilterSchema.parse(params);
    const result = await listInvoices(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
