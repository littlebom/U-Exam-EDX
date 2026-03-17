import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { swapSeats } from "@/services/seat-booking.service";
import { swapSeatsSchema } from "@/lib/validations/seat-booking";
import { handleApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("registration:approve");
    const body = await req.json();
    const data = swapSeatsSchema.parse(body);
    const result = await swapSeats(session.tenantId, data.registrationId1, data.registrationId2);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
