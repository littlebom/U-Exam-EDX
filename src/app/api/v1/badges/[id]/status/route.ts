import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, errors } from "@/lib/errors";

/**
 * GET /api/v1/badges/[id]/status — Badge revocation status check
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cert = await prisma.certificate.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        revokedAt: true,
        revokeReason: true,
        expiresAt: true,
      },
    });

    if (!cert) throw errors.notFound("Badge not found");

    const isExpired = cert.expiresAt
      ? new Date() > cert.expiresAt
      : false;

    return NextResponse.json({
      id: cert.id,
      status: cert.status,
      isRevoked: cert.status === "REVOKED",
      isExpired,
      isValid: cert.status === "ACTIVE" && !isExpired,
      revokedAt: cert.revokedAt,
      revokeReason: cert.revokeReason,
      expiresAt: cert.expiresAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
