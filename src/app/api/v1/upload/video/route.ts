import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/errors";
import { createVideoMediaFile } from "@/services/media.service";
import { isValidVideoUrl } from "@/lib/media-utils";

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("question:create");
    const body = await request.json();

    const url = body.url as string | undefined;
    if (!url || !isValidVideoUrl(url)) {
      return NextResponse.json(
        {
          success: false,
          error: "URL วิดีโอไม่ถูกต้อง กรุณาใช้ YouTube หรือ Vimeo",
        },
        { status: 400 }
      );
    }

    const mediaFile = await createVideoMediaFile(
      session.tenantId,
      session.userId,
      url
    );

    return NextResponse.json({ success: true, data: mediaFile });
  } catch (error) {
    return handleApiError(error);
  }
}
