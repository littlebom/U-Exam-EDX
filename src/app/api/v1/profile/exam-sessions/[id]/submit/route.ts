import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { submitExam } from "@/services/exam-session.service";
import { handleApiError, AppError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const { id } = await context.params;
    const result = await submitExam(id, session.user.id);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
