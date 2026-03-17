import { NextRequest, NextResponse } from "next/server";
import { listCatalog } from "@/services/registration.service";
import { catalogFilterSchema } from "@/lib/validations/registration";
import { handleApiError } from "@/lib/errors";

// Public endpoint — no auth required
export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = catalogFilterSchema.parse(params);
    const result = await listCatalog(filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
