import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listTestCenters, createTestCenter } from "@/services/test-center.service";
import { testCenterFilterSchema, createTestCenterSchema } from "@/lib/validations/test-center";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("center:list");
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = testCenterFilterSchema.parse(params);
    const result = await listTestCenters(session.tenantId, filters);

    return NextResponse.json({ success: true, data: result.data, meta: result.meta });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("center:manage");
    const body = await req.json();
    const data = createTestCenterSchema.parse(body);
    const center = await createTestCenter(session.tenantId, data);

    return NextResponse.json({ success: true, data: center }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
