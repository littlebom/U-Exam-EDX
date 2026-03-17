import { NextRequest, NextResponse } from "next/server";
import { requestEmailChange } from "@/services/email-change.service";
import { handleApiError } from "@/lib/errors";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { createRateLimiter } from "@/lib/rate-limit";

// 3 requests per minute per IP
const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 3 });

const requestEmailChangeSchema = z.object({
  newEmail: z.string().email("อีเมลไม่ถูกต้อง").max(255),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateResult = limiter.check(req);
  if (!rateResult.success) return rateResult.response!;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "กรุณาเข้าสู่ระบบ" } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const data = requestEmailChangeSchema.parse(body);
    const result = await requestEmailChange(
      session.user.id,
      data.newEmail,
      data.password
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
