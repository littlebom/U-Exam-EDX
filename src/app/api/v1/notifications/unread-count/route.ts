import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { getUnreadCount } from "@/services/notification.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "กรุณาเข้าสู่ระบบ" } },
        { status: 401 }
      );
    }

    const count = await getUnreadCount(session.user.id);
    return NextResponse.json({ success: true, data: { count } });
  } catch (error) {
    return handleApiError(error);
  }
}
