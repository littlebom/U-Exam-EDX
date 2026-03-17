import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getRegistration, updateRegistration, deleteRegistration } from "@/services/registration.service";
import { updateRegistrationSchema } from "@/lib/validations/registration";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await requirePermission("registration:list");
    const { id } = await ctx.params;
    const registration = await getRegistration(session.tenantId, id);

    return NextResponse.json({ success: true, data: registration });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await requirePermission("registration:approve");
    const { id } = await ctx.params;
    const body = await req.json();
    const data = updateRegistrationSchema.parse(body);
    const registration = await updateRegistration(session.tenantId, id, data);

    return NextResponse.json({ success: true, data: registration });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await requirePermission("registration:cancel");
    const { id } = await ctx.params;
    await deleteRegistration(session.tenantId, id);

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleApiError(error);
  }
}
