import { NextRequest, NextResponse } from "next/server";
import { getSessionTenant } from "@/lib/get-session";
import { getRole, updateRolePermissions } from "@/services/role.service";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ roleId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionTenant();
    const { roleId } = await params;

    const role = await getRole(roleId, session.tenantId);

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    return handleApiError(error);
  }
}

const updateSchema = z.object({
  permissionIds: z.array(z.string().uuid()),
});

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionTenant();
    const { roleId } = await params;

    const body = await req.json();
    const { permissionIds } = updateSchema.parse(body);

    const role = await updateRolePermissions(roleId, session.tenantId, permissionIds);

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    return handleApiError(error);
  }
}
