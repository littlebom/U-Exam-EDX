import { NextRequest, NextResponse } from "next/server";
import { validateVoucher } from "@/services/voucher.service";
import { validateVoucherSchema } from "@/lib/validations/voucher";
import { handleApiError } from "@/lib/errors";

// Public endpoint — for check-in scanning
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = validateVoucherSchema.parse(body);
    const result = await validateVoucher(data.code);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
