import { NextRequest, NextResponse } from "next/server";
import { listCandidateCertificates } from "@/services/certificate.service";
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

    const url = new URL(req.url);
    const result = await listCandidateCertificates(session.user.id, {
      page: parseInt(url.searchParams.get("page") ?? "1", 10),
      perPage: parseInt(url.searchParams.get("perPage") ?? "20", 10),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
