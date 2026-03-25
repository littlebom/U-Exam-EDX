import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getTenant, updateTenantSettings } from "@/services/tenant.service";
import { updateTenantSchema } from "@/lib/validations/tenant";
import { handleApiError, errors } from "@/lib/errors";

type RouteContext = { params: Promise<{ tenantId: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("tenant:settings");
    const { tenantId } = await context.params;

    // Only allow access to own tenant
    if (tenantId !== session.tenantId) {
      throw errors.forbidden("ไม่สามารถเข้าถึงข้อมูลองค์กรอื่นได้");
    }

    const tenant = await getTenant(tenantId);

    return NextResponse.json({ success: true, data: tenant });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("tenant:settings");
    const { tenantId } = await context.params;

    // Only allow update to own tenant
    if (tenantId !== session.tenantId) {
      throw errors.forbidden("ไม่สามารถแก้ไขข้อมูลองค์กรอื่นได้");
    }

    const body = await req.json();
    const data = updateTenantSchema.parse(body);

    const tenant = await updateTenantSettings(tenantId, {
      name: data.name,
      settings: data.settings as Record<string, unknown>,
    });

    const { logAdminAction } = await import("@/services/audit-log.service");
    logAdminAction("SETTINGS_UPDATE", { userId: session.userId, tenantId, detail: { fields: Object.keys(data) } });

    return NextResponse.json({ success: true, data: tenant });
  } catch (error) {
    return handleApiError(error);
  }
}
