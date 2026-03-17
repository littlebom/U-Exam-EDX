import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listTags, createTag } from "@/services/category.service";
import { createTagSchema } from "@/lib/validations/category";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await requirePermission("question:list");
    const tags = await listTags(session.tenantId);

    return NextResponse.json({ success: true, data: tags });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("question:create");
    const body = await request.json();
    const parsed = createTagSchema.parse(body);
    const tag = await createTag(session.tenantId, parsed);

    return NextResponse.json({ success: true, data: tag }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
