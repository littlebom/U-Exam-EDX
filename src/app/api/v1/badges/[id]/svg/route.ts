import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, errors } from "@/lib/errors";
import { generateBadgeSvg } from "@/lib/open-badge";

/**
 * GET /api/v1/badges/[id]/svg — Badge image as SVG
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cert = await prisma.certificate.findUnique({
      where: { id },
      include: {
        tenant: { select: { name: true } },
        template: { select: { design: true } },
        grade: {
          select: {
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
    });

    if (!cert) throw errors.notFound("Badge not found");

    const design = (cert.template?.design ?? {}) as Record<string, unknown>;

    const svg = generateBadgeSvg({
      examTitle:
        cert.grade?.session?.examSchedule?.exam?.title ?? "Examination",
      tenantName: cert.tenant.name,
      certificateNumber: cert.certificateNumber,
      issuedDate: cert.issuedAt.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      primaryColor: (design.primaryColor as string) ?? "#741717",
    });

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
