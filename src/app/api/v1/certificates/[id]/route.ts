import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getCertificate, revokeCertificate } from "@/services/certificate.service";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("certificate:list");
    const { id } = await context.params;

    const result = await getCertificate(session.tenantId, id);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

const revokeSchema = z.object({
  reason: z.string().min(1, "กรุณาระบุเหตุผล"),
});

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("certificate:create");
    const { id } = await context.params;
    const body = await req.json();
    const { reason } = revokeSchema.parse(body);

    const result = await revokeCertificate(session.tenantId, id, reason);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
