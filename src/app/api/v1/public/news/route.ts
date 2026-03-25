import { NextRequest, NextResponse } from "next/server";
import { listPublishedNews } from "@/services/news.service";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

const publicNewsFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = publicNewsFilterSchema.parse(params);
    const result = await listPublishedNews(filters);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
