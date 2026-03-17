import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { revokeApiKey, deleteApiKey } from "@/services/api-key.service";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

// Revoke (soft-delete)
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("settings:api-keys");
    const { id } = await context.params;

    const result = await revokeApiKey(session.tenantId, id);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

// Delete (hard-delete)
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("settings:api-keys");
    const { id } = await context.params;

    await deleteApiKey(session.tenantId, id);

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
