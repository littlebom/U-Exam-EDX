import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listWaitingList } from "@/services/waiting-list.service";
import { waitingListFilterSchema } from "@/lib/validations/voucher";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("registration:list");
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = waitingListFilterSchema.parse(params);
    const result = await listWaitingList(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
