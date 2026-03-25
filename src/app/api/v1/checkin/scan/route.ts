import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { checkInByVoucher } from "@/services/checkin.service";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";
import { createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

const scanSchema = z.object({
  voucherCode: z.string().min(1, "กรุณาระบุรหัส Voucher"),
  examScheduleId: z.string().uuid("กรุณาระบุรอบสอบ"),
});

export async function POST(req: NextRequest) {
  const rl = limiter.check(req);
  if (!rl.success) return rl.response!;

  try {
    const session = await requirePermission("session:manage");
    const body = await req.json();
    const { voucherCode, examScheduleId } = scanSchema.parse(body);
    const result = await checkInByVoucher(
      session.tenantId,
      voucherCode,
      examScheduleId,
      session.userId
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
