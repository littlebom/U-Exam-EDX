import { NextRequest, NextResponse } from "next/server";
import { adminChangeEmail } from "@/services/email-change.service";
import { requirePermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

const adminEmailChangeSchema = z.object({
  newEmail: z.string().email("อีเมลไม่ถูกต้อง").max(255),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; userId: string }> }
) {
  try {
    await requirePermission("user:update");
    const { userId } = await params;

    const body = await req.json();
    const data = adminEmailChangeSchema.parse(body);
    const result = await adminChangeEmail(userId, data.newEmail);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
