import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listAuditLogs } from "@/services/audit-log.service";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("tenant:settings");
    const url = new URL(req.url);

    const result = await listAuditLogs({
      tenantId: session.tenantId,
      category: url.searchParams.get("category") ?? undefined,
      action: url.searchParams.get("action") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      page: parseInt(url.searchParams.get("page") ?? "1", 10),
      perPage: parseInt(url.searchParams.get("perPage") ?? "50", 10),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
