import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getRegistrationStats } from "@/services/registration.service";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await requirePermission("registration:list");
    const stats = await getRegistrationStats(session.tenantId);

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return handleApiError(error);
  }
}
