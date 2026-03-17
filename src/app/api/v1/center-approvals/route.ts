import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listApprovals, submitForApproval } from "@/services/center-approval.service";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("center:manage");
    const { searchParams } = new URL(req.url);

    const approvals = await listApprovals(session.tenantId, {
      status: searchParams.get("status") ?? undefined,
      testCenterId: searchParams.get("testCenterId") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      page: Number(searchParams.get("page") ?? 1),
      perPage: Number(searchParams.get("perPage") ?? 20),
    });

    return NextResponse.json({ success: true, ...approvals });
  } catch (error) {
    return handleApiError(error);
  }
}

const submitSchema = z.object({
  testCenterId: z.string().uuid(),
  type: z.enum(["INITIAL", "RENEWAL"]),
  documents: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url(),
        type: z.string(),
      })
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("center:manage");
    const body = await req.json();
    const data = submitSchema.parse(body);
    const result = await submitForApproval(session.tenantId, data);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
