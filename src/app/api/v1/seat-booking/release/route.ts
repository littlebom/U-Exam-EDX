import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { releaseSeat } from "@/services/seat-booking.service";
import { releaseSeatSchema } from "@/lib/validations/seat-booking";
import { handleApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("registration:approve");
    const body = await req.json();
    const data = releaseSeatSchema.parse(body);
    const result = await releaseSeat(session.tenantId, data.registrationId);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
