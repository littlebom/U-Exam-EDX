import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listCategories, createCategory } from "@/services/category.service";
import { createCategorySchema } from "@/lib/validations/category";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await requirePermission("question:list");
    const categories = await listCategories(session.tenantId);

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("question:create");
    const body = await request.json();
    const parsed = createCategorySchema.parse(body);
    const category = await createCategory(session.tenantId, parsed);

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
