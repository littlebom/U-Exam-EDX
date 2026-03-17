import { NextRequest, NextResponse } from "next/server";
import { verifyExternalRequest } from "@/lib/external-auth";
import { listExamResults } from "@/services/exam-history.service";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const auth = await verifyExternalRequest(req);
    if (!auth.success) return auth.response;

    const { id: studentId } = await context.params;
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const perPage = parseInt(url.searchParams.get("perPage") ?? "20", 10);

    const results = await listExamResults(studentId, { page, perPage });

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    return handleApiError(error);
  }
}
