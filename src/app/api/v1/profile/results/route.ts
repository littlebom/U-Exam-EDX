import { NextRequest, NextResponse } from "next/server";
import { listExamResults } from "@/services/exam-history.service";
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
    const results = await listExamResults(session.user.id, {
      page: Number(searchParams.get("page") ?? 1),
      perPage: Number(searchParams.get("perPage") ?? 20),
    });

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    return handleApiError(error);
  }
}
