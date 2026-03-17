import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { updateWebhook, deleteWebhook } from "@/services/webhook.service";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("settings:webhooks");
    const { id } = await context.params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const result = await updateWebhook(session.tenantId, id, data);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("settings:webhooks");
    const { id } = await context.params;

    await deleteWebhook(session.tenantId, id);

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
