import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { getPreferences, updatePreference } from "@/services/notification-preference.service";
import { z } from "zod";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "กรุณาเข้าสู่ระบบ" } },
        { status: 401 }
      );
    }

    const preferences = await getPreferences(session.user.id);
    return NextResponse.json({ success: true, data: preferences });
  } catch (error) {
    return handleApiError(error);
  }
}

const updateSchema = z.object({
  type: z.string().min(1),
  inApp: z.boolean().optional(),
  email: z.boolean().optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "กรุณาเข้าสู่ระบบ" } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type, inApp, email } = updateSchema.parse(body);

    await updatePreference(session.user.id, type, { inApp, email });
    return NextResponse.json({ success: true, data: { updated: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
