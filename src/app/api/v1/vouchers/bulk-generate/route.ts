import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { bulkGenerateVouchers } from "@/services/voucher.service";
import { handleApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("registration:approve");
    const body = await req.json();
    const { examScheduleId } = body;

    if (!examScheduleId) {
      return NextResponse.json(
        { success: false, error: "examScheduleId is required" },
        { status: 400 }
      );
    }

    const result = await bulkGenerateVouchers(session.tenantId, examScheduleId);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
