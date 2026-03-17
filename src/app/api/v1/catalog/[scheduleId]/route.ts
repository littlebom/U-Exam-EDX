import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ scheduleId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { scheduleId } = await context.params;

    const schedule = await prisma.examSchedule.findFirst({
      where: {
        id: scheduleId,
        status: { in: ["SCHEDULED", "ACTIVE"] },
        startDate: { gte: new Date() },
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            description: true,
            mode: true,
            duration: true,
            passingScore: true,
          },
        },
        tenant: { select: { id: true, name: true } },
        testCenter: {
          select: {
            id: true,
            name: true,
            address: true,
            district: true,
            province: true,
          },
        },
        room: { select: { id: true, name: true, capacity: true } },
        _count: {
          select: {
            registrations: { where: { status: { in: ["CONFIRMED", "PENDING"] } } },
          },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: { message: "ไม่พบรอบสอบ" } },
        { status: 404 }
      );
    }

    // If no pre-assigned test center, fetch all available test centers for this tenant
    let availableTestCenters: Array<{
      id: string;
      name: string;
      address: string;
      province: string;
    }> = [];

    if (!schedule.testCenterId) {
      availableTestCenters = await prisma.testCenter.findMany({
        where: { tenantId: schedule.tenantId, status: "ACTIVE" },
        select: { id: true, name: true, address: true, province: true },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...schedule,
        availableTestCenters,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
