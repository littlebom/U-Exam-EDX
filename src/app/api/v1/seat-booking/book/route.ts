import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { bookSeat } from "@/services/seat-booking.service";
import { bookSeatSchema } from "@/lib/validations/seat-booking";
import { handleApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("registration:approve");
    const body = await req.json();
    const data = bookSeatSchema.parse(body);
    const result = await bookSeat(session.tenantId, data);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
