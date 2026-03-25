import { NextRequest, NextResponse } from "next/server";
import { validateVoucher } from "@/services/voucher.service";
import { validateVoucherSchema } from "@/lib/validations/voucher";
import { requirePermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/errors";
import { createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

// Requires authentication + session:manage permission (for check-in staff)
export async function POST(req: NextRequest) {
  const rl = limiter.check(req);
  if (!rl.success) return rl.response!;

  try {
    const session = await requirePermission("session:manage");
    const body = await req.json();
    const data = validateVoucherSchema.parse(body);
    const result = await validateVoucher(data.code, session.tenantId);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
