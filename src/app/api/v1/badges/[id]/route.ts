import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, errors } from "@/lib/errors";
import { generateOpenBadge, type BadgeInput } from "@/lib/open-badge";

/**
 * GET /api/v1/badges/[id] — Public Open Badge 3.0 JSON-LD endpoint
 * Returns the badge credential for a given certificate ID
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
        candidate: { select: { name: true, email: true } },
        tenant: { select: { name: true, settings: true } },
        grade: {
          select: {
            totalScore: true,
            maxScore: true,
            percentage: true,
            isPassed: true,
            session: {
              select: {
                examSchedule: {
                  select: {
                    exam: { select: { title: true, description: true } },
                  },
                },
              },
            },
          },
        },
        digitalBadge: true,
      },
    });

    if (!cert) throw errors.notFound("Badge not found");

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://u-exam.com";

    const badgeInput: BadgeInput = {
      certificateId: cert.id,
      certificateNumber: cert.certificateNumber,
      issuedAt: cert.issuedAt,
      expiresAt: cert.expiresAt,
      status: cert.status,
      candidateName: cert.candidate.name ?? "Unknown",
      candidateEmail: cert.candidate.email ?? undefined,
      examTitle:
        cert.grade?.session?.examSchedule?.exam?.title ?? "Examination",
      examDescription:
        cert.grade?.session?.examSchedule?.exam?.description ?? undefined,
      score: cert.grade?.totalScore ?? undefined,
      maxScore: cert.grade?.maxScore ?? undefined,
      percentage: cert.grade?.percentage ?? undefined,
      isPassed: cert.grade?.isPassed ?? undefined,
      tenantName: cert.tenant.name,
      baseUrl,
      verificationUrl: cert.verificationUrl ?? `/verify/${cert.certificateNumber}`,
    };

    const badge = generateOpenBadge(badgeInput);

    return NextResponse.json(badge, {
      headers: {
        "Content-Type": "application/ld+json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
