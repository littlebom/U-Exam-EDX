import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ scheduleId: string }> };

/**
 * GET /api/v1/checkin/[scheduleId]/descriptors
 *
 * Returns face descriptors for all confirmed candidates in a schedule.
 * Used by the face scan check-in page to build a FaceMatcher.
 * Auth: session:manage permission.
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermission("session:manage");
    const { scheduleId } = await context.params;

    // Get all confirmed registrations with candidate face descriptors
    const registrations = await prisma.registration.findMany({
      where: {
        tenantId: session.tenantId,
        examScheduleId: scheduleId,
        status: "CONFIRMED",
      },
      select: {
        id: true,
        seatNumber: true,
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
            candidateProfile: {
              select: {
                faceDescriptor: true,
              },
            },
          },
        },
      },
    });

    const candidates = registrations
      .filter((r) => r.candidate.candidateProfile?.faceDescriptor)
      .map((r) => ({
        candidateId: r.candidate.id,
        registrationId: r.id,
        name: r.candidate.name,
        email: r.candidate.email,
        imageUrl: r.candidate.imageUrl,
        seatNumber: r.seatNumber,
        descriptor: r.candidate.candidateProfile!.faceDescriptor as number[],
      }));

    const totalRegistered = registrations.length;
    const withDescriptor = candidates.length;

    return NextResponse.json({
      success: true,
      data: candidates,
      meta: { totalRegistered, withDescriptor, withoutDescriptor: totalRegistered - withDescriptor },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
