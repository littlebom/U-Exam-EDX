import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listApiKeys, generateApiKey } from "@/services/api-key.service";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

export async function GET() {
  try {
    const session = await requirePermission("settings:api-keys");
    const keys = await listApiKeys(session.tenantId);

    return NextResponse.json({ success: true, data: keys });
  } catch (error) {
    return handleApiError(error);
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(255),
  expiresAt: z.string().datetime().optional(),
  scopes: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("settings:api-keys");
    const body = await req.json();
    const data = createSchema.parse(body);

    const result = await generateApiKey(session.tenantId, {
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
