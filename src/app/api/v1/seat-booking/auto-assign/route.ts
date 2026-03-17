import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { autoAssignSeats } from "@/services/seat-booking.service";
import { autoAssignSeatsSchema } from "@/lib/validations/seat-booking";
import { handleApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("registration:approve");
    const body = await req.json();
    const data = autoAssignSeatsSchema.parse(body);
    const result = await autoAssignSeats(session.tenantId, data.examScheduleId, data.roomId);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
