import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listWebhooks, createWebhook } from "@/services/webhook.service";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

export async function GET() {
  try {
    const session = await requirePermission("settings:webhooks");
    const webhooks = await listWebhooks(session.tenantId);

    return NextResponse.json({ success: true, data: webhooks });
  } catch (error) {
    return handleApiError(error);
  }
}

const createSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("settings:webhooks");
    const body = await req.json();
    const data = createSchema.parse(body);

    const result = await createWebhook(session.tenantId, data);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
