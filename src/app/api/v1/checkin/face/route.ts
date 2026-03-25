import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/errors";
import { checkInByFace } from "@/services/checkin.service";
import { checkinFaceScanSchema } from "@/lib/validations/checkin";
import { createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

/**
 * POST /api/v1/checkin/face
 *
 * Check in a candidate using face recognition match.
 * Called by the mobile check-in page after face matching succeeds client-side.
 * Auth: session:manage permission.
 */
export async function POST(req: NextRequest) {
  const rl = limiter.check(req);
  if (!rl.success) return rl.response!;

  try {
    const session = await requirePermission("session:manage");
    const body = await req.json();
    const data = checkinFaceScanSchema.parse(body);

    const result = await checkInByFace(
      session.tenantId,
      data.examScheduleId,
      data.candidateId,
      session.userId,
      data.confidence
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
