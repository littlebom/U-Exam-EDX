import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";
import { parsePagination } from "@/lib/pagination";

/**
 * GET /api/v1/badges — List all badges (admin)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("certificate:read");
    const url = new URL(req.url);
    const { page, perPage } = parsePagination(
      parseInt(url.searchParams.get("page") ?? "1", 10),
      parseInt(url.searchParams.get("perPage") ?? "20", 10)
    );

    const where = {
      certificate: { tenantId: session.tenantId },
    };

    const [badges, total] = await Promise.all([
      prisma.digitalBadge.findMany({
        where,
        include: {
          certificate: {
            select: {
              id: true,
              certificateNumber: true,
              status: true,
              issuedAt: true,
              expiresAt: true,
              candidate: { select: { name: true, email: true } },
              grade: {
                select: {
                  percentage: true,
                  session: {
                    select: {
                      examSchedule: {
                        select: {
                          exam: { select: { title: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.digitalBadge.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: badges,
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
