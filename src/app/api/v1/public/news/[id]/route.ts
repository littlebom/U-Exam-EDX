import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, errors } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const news = await prisma.news.findFirst({
      where: { id, status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        content: true,
        coverImage: true,
        publishedAt: true,
        createdAt: true,
        createdBy: { select: { name: true } },
      },
    });

    if (!news) throw errors.notFound("ไม่พบข่าวสาร");

    return NextResponse.json({ success: true, data: news });
  } catch (error) {
    return handleApiError(error);
  }
}
