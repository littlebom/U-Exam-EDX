import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import {
  listCertificateTemplates,
  createCertificateTemplate,
} from "@/services/certificate-template.service";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("certificate:template");
    const url = new URL(req.url);

    const result = await listCertificateTemplates(session.tenantId, {
      page: parseInt(url.searchParams.get("page") ?? "1", 10),
      perPage: parseInt(url.searchParams.get("perPage") ?? "20", 10),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(255),
  design: z.record(z.string(), z.unknown()),
  variables: z
    .array(z.object({ name: z.string(), description: z.string(), default: z.string().optional() }))
    .optional(),
  isDefault: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("certificate:template");
    const body = await req.json();
    const data = createSchema.parse(body);

    const result = await createCertificateTemplate(session.tenantId, data);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
