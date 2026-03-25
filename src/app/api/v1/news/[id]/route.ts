import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getNews, updateNews, deleteNews } from "@/services/news.service";
import { updateNewsSchema } from "@/lib/validations/news";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await requirePermission("notification:list");
    const { id } = await ctx.params;
    const news = await getNews(session.tenantId, id);

    return NextResponse.json({ success: true, data: news });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await requirePermission("notification:create");
    const { id } = await ctx.params;
    const body = await req.json();
    const data = updateNewsSchema.parse(body);
    const news = await updateNews(session.tenantId, id, data);

    return NextResponse.json({ success: true, data: news });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await requirePermission("notification:create");
    const { id } = await ctx.params;
    await deleteNews(session.tenantId, id);

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
