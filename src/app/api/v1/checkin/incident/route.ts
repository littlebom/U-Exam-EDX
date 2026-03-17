import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { logIncident } from "@/services/checkin.service";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

const incidentSchema = z.object({
  examScheduleId: z.string().uuid(),
  description: z.string().min(1, "กรุณาระบุรายละเอียด"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  testCenterId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("session:manage");
    const body = await req.json();
    const data = incidentSchema.parse(body);
    const result = await logIncident(
      session.tenantId,
      data.examScheduleId,
      {
        description: data.description,
        severity: data.severity,
        testCenterId: data.testCenterId,
        metadata: data.metadata,
      },
      session.userId
    );

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
