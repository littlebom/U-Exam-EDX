import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getAvailableSeats } from "@/services/seat-booking.service";
import { seatAvailabilityFilterSchema } from "@/lib/validations/seat-booking";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("registration:list");
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = seatAvailabilityFilterSchema.parse(params);
    const result = await getAvailableSeats(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
