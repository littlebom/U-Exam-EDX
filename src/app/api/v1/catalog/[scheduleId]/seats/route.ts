import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAvailableSeats } from "@/services/seat-booking.service";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ scheduleId: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "กรุณาเข้าสู่ระบบ" } },
        { status: 401 }
      );
    }

    const { scheduleId } = await context.params;

    // Fetch schedule to get tenantId, testCenterId, roomId
    const schedule = await prisma.examSchedule.findFirst({
      where: {
        id: scheduleId,
        status: { in: ["SCHEDULED", "ACTIVE"] },
      },
      select: {
        id: true,
        tenantId: true,
        testCenterId: true,
        roomId: true,
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: { message: "ไม่พบรอบสอบ" } },
        { status: 404 }
      );
    }

    // If no room assigned, no seats to show
    if (!schedule.roomId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const result = await getAvailableSeats(schedule.tenantId, {
      examScheduleId: scheduleId,
      testCenterId: schedule.testCenterId ?? undefined,
      roomId: schedule.roomId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
