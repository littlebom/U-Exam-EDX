import { NextRequest, NextResponse } from "next/server";
import { verifyCertificate } from "@/services/certificate.service";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ number: string }> };

// Public endpoint — no authentication required
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { number } = await context.params;
    const result = await verifyCertificate(number);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
