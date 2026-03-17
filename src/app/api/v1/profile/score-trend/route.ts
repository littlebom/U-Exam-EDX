import { NextResponse } from "next/server";
import { getScoreTrend } from "@/services/profile.service";
import { handleApiError } from "@/lib/errors";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "กรุณาเข้าสู่ระบบ" } },
        { status: 401 }
      );
    }

    const trend = await getScoreTrend(session.user.id);

    return NextResponse.json({ success: true, data: trend });
  } catch (error) {
    return handleApiError(error);
  }
}
