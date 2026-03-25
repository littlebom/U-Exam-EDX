import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/errors";
import { parsePagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("tenant:settings");
    const { page, perPage } = parsePagination(req.nextUrl.searchParams);
    const platformId = req.nextUrl.searchParams.get("platformId");

    const where = {
      platform: { tenantId: session.tenantId },
      ...(platformId ? { platformId } : {}),
    };

    const [links, total] = await Promise.all([
      prisma.ltiUserLink.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
          platform: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.ltiUserLink.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: links,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
