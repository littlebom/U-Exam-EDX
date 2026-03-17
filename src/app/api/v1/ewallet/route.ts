import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import {
  getEwalletConnection,
  saveEwalletConnection,
  toggleEwalletConnection,
} from "@/services/ewallet.service";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

export async function GET() {
  try {
    const session = await requirePermission("settings:ewallet");
    const connection = await getEwalletConnection(session.tenantId);

    // Mask secrets for display
    const masked = connection
      ? {
          ...connection,
          apiKey: connection.apiKey.slice(0, 8) + "..." + connection.apiKey.slice(-4),
          apiSecret: "••••••••",
          webhookSecret: "••••••••",
        }
      : null;

    return NextResponse.json({ success: true, data: masked });
  } catch (error) {
    return handleApiError(error);
  }
}

const connectionSchema = z.object({
  apiUrl: z.string().url(),
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
  webhookSecret: z.string().min(1),
  isActive: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("settings:ewallet");
    const body = await req.json();
    const data = connectionSchema.parse(body);

    const result = await saveEwalletConnection(session.tenantId, data);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

const toggleSchema = z.object({
  isActive: z.boolean(),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await requirePermission("settings:ewallet");
    const body = await req.json();
    const { isActive } = toggleSchema.parse(body);

    const result = await toggleEwalletConnection(session.tenantId, isActive);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
