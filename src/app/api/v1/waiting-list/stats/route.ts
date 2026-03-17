import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getWaitingListStats } from "@/services/waiting-list.service";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await requirePermission("registration:list");
    const stats = await getWaitingListStats(session.tenantId);

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return handleApiError(error);
  }
}
