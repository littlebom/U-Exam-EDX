import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { listSeats } from "@/services/seat-equipment.service";
import { seatFilterSchema } from "@/lib/validations/seat-equipment";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("center:list");
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = seatFilterSchema.parse(params);
    const result = await listSeats(session.tenantId, filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
