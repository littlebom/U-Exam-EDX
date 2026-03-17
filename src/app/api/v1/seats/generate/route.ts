import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { bulkCreateSeats } from "@/services/seat-equipment.service";
import { bulkCreateSeatsSchema } from "@/lib/validations/seat-equipment";
import { handleApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("center:manage");
    const body = await req.json();
    const data = bulkCreateSeatsSchema.parse(body);
    const result = await bulkCreateSeats(session.tenantId, data);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
