import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getVoucher, useVoucher, cancelVoucher } from "@/services/voucher.service";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await requirePermission("registration:list");
    const { id } = await ctx.params;
    const voucher = await getVoucher(session.tenantId, id);

    return NextResponse.json({ success: true, data: voucher });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await requirePermission("registration:approve");
    const { id } = await ctx.params;
    const body = await req.json();

    let result;
    if (body.action === "use") {
      result = await useVoucher(session.tenantId, id);
    } else if (body.action === "cancel") {
      result = await cancelVoucher(session.tenantId, id);
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action. Use 'use' or 'cancel'." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
