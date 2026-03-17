import { NextRequest, NextResponse } from "next/server";
import { getPrivacySettings, updatePrivacySettings } from "@/services/privacy.service";
import { handleApiError } from "@/lib/errors";
import { auth } from "@/lib/auth";
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

    const settings = await getPrivacySettings(session.user.id);
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return handleApiError(error);
  }
}

const privacySchema = z.object({
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  showResults: z.boolean().optional(),
  showCertificates: z.boolean().optional(),
  showInstitution: z.boolean().optional(),
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
    const data = privacySchema.parse(body);
    const result = await updatePrivacySettings(session.user.id, data);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
