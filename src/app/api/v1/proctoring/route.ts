import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { getActiveProctoringeSessions } from "@/services/proctoring.service";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("proctoring:monitor");
    const url = new URL(req.url);

    const result = await getActiveProctoringeSessions({
      status: url.searchParams.get("status") ?? undefined,
      page: parseInt(url.searchParams.get("page") ?? "1", 10),
      perPage: parseInt(url.searchParams.get("perPage") ?? "20", 10),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
