import { NextRequest, NextResponse } from "next/server";
import { confirmEmailChange } from "@/services/email-change.service";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: "ไม่มี token" } },
        { status: 400 }
      );
    }

    const result = await confirmEmailChange(token);

    // Redirect to profile with success
    return NextResponse.redirect(
      new URL("/profile?emailChanged=true", req.nextUrl.origin)
    );
  } catch (error) {
    return handleApiError(error);
  }
}
