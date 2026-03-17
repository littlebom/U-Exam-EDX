import { NextRequest, NextResponse } from "next/server";
import { verifyExternalRequest } from "@/lib/external-auth";
import { getProfileDashboard } from "@/services/profile.service";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const auth = await verifyExternalRequest(req);
    if (!auth.success) return auth.response;

    const { id: studentId } = await context.params;
    const dashboard = await getProfileDashboard(studentId);

    return NextResponse.json({
      success: true,
      data: {
        name: dashboard.user.name,
        email: dashboard.user.email,
        imageUrl: dashboard.user.imageUrl,
        stats: dashboard.stats,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
