import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listNews, createNews } from "@/services/news.service";
import { newsFilterSchema, createNewsSchema } from "@/lib/validations/news";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("notification:list");
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = newsFilterSchema.parse(params);
    const result = await listNews(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("notification:create");
    const body = await req.json();
    const data = createNewsSchema.parse(body);
    const news = await createNews(session.tenantId, session.userId, data);

    return NextResponse.json({ success: true, data: news }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
