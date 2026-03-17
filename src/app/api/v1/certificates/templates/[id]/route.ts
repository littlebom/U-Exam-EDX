import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import {
  getCertificateTemplate,
  updateCertificateTemplate,
  deleteCertificateTemplate,
} from "@/services/certificate-template.service";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("certificate:template");
    const { id } = await context.params;

    const result = await getCertificateTemplate(session.tenantId, id);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  design: z.record(z.string(), z.unknown()).optional(),
  variables: z
    .array(z.object({ name: z.string(), description: z.string(), default: z.string().optional() }))
    .optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("certificate:template");
    const { id } = await context.params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const result = await updateCertificateTemplate(session.tenantId, id, data);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("certificate:template");
    const { id } = await context.params;

    await deleteCertificateTemplate(session.tenantId, id);

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
