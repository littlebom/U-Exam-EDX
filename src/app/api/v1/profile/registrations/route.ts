import { NextRequest, NextResponse } from "next/server";
import { getRegistrationHistory } from "@/services/exam-history.service";
import { handleApiError } from "@/lib/errors";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "กรุณาเข้าสู่ระบบ" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
    const perPage = Math.min(100, Math.max(1, Number(searchParams.get("perPage") ?? 20) || 20));
    const registrations = await getRegistrationHistory(session.user.id, { page, perPage });

    return NextResponse.json({ success: true, ...registrations });
  } catch (error) {
    return handleApiError(error);
  }
}
