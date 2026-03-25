import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/errors";
import { cleanupOldAuditLogs } from "@/services/audit-log.service";

/**
 * POST /api/v1/audit-logs/cleanup — Manual cleanup of old audit logs
 * Also called by BullMQ scheduled job
 */
export async function POST() {
  try {
    const session = await requirePermission("tenant:settings");
    const result = await cleanupOldAuditLogs(session.tenantId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
