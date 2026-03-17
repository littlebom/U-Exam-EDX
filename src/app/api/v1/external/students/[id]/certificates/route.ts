import { NextRequest, NextResponse } from "next/server";
import { verifyExternalRequest } from "@/lib/external-auth";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

// Note: Certificate model will be added in Phase 20.
// This is a placeholder that returns empty data until then.
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const auth = await verifyExternalRequest(req);
    if (!auth.success) return auth.response;

    const { id: studentId } = await context.params;

    // TODO: Phase 20 — query Certificate model
    return NextResponse.json({
      success: true,
      data: [],
      meta: { total: 0, page: 1, perPage: 20, totalPages: 0 },
      _note: `Certificates for student ${studentId} — available after Phase 20`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
