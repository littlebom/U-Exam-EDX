import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getTestCenter, updateTestCenter, deleteTestCenter } from "@/services/test-center.service";
import { updateTestCenterSchema } from "@/lib/validations/test-center";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("center:list");
    const { id } = await context.params;
    const center = await getTestCenter(session.tenantId, id);

    return NextResponse.json({ success: true, data: center });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("center:manage");
    const { id } = await context.params;
    const body = await req.json();
    const data = updateTestCenterSchema.parse(body);
    const center = await updateTestCenter(session.tenantId, id, data);

    return NextResponse.json({ success: true, data: center });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("center:manage");
    const { id } = await context.params;
    await deleteTestCenter(session.tenantId, id);

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleApiError(error);
  }
}
