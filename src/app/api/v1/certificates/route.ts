import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listCertificates, issueCertificate } from "@/services/certificate.service";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("certificate:list");
    const url = new URL(req.url);

    const result = await listCertificates(session.tenantId, {
      candidateId: url.searchParams.get("candidateId") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      page: parseInt(url.searchParams.get("page") ?? "1", 10),
      perPage: parseInt(url.searchParams.get("perPage") ?? "20", 10),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

const issueSchema = z.object({
  templateId: z.string().uuid(),
  candidateId: z.string().uuid(),
  gradeId: z.string().uuid(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("certificate:create");
    const body = await req.json();
    const data = issueSchema.parse(body);

    const result = await issueCertificate(session.tenantId, {
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
