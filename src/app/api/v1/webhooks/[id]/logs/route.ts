import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getWebhookLogs } from "@/services/webhook.service";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("settings:webhooks");
    const { id } = await context.params;
    const url = new URL(req.url);

    const result = await getWebhookLogs(session.tenantId, id, {
      page: parseInt(url.searchParams.get("page") ?? "1", 10),
      perPage: parseInt(url.searchParams.get("perPage") ?? "20", 10),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
