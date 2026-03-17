import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";
import { candidateSelfRegisterSchema } from "@/lib/validations/registration";
import {
  createRegistration,
  updateRegistration,
} from "@/services/registration.service";
import { bookSeat } from "@/services/seat-booking.service";

type RouteContext = { params: Promise<{ scheduleId: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "กรุณาเข้าสู่ระบบ" } },
        { status: 401 }
      );
    }

    const { scheduleId } = await context.params;
    const body = await req.json();
    const data = candidateSelfRegisterSchema.parse(body);

    // Fetch exam schedule to get tenantId and validate
    const schedule = await prisma.examSchedule.findFirst({
      where: {
        id: scheduleId,
        status: { in: ["SCHEDULED", "ACTIVE"] },
      },
      select: {
        id: true,
        tenantId: true,
        startDate: true,
        registrationDeadline: true,
        maxCandidates: true,
        testCenterId: true,
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: { message: "ไม่พบรอบสอบหรือรอบสอบปิดรับสมัครแล้ว" } },
        { status: 404 }
      );
    }

    // Check registration deadline
    if (schedule.registrationDeadline && new Date() > schedule.registrationDeadline) {
      return NextResponse.json(
        { success: false, error: { message: "หมดเวลารับสมัครแล้ว" } },
        { status: 422 }
      );
    }

    // Check exam hasn't started yet
    if (new Date() > schedule.startDate) {
      return NextResponse.json(
        { success: false, error: { message: "รอบสอบนี้เริ่มแล้ว ไม่สามารถสมัครได้" } },
        { status: 422 }
      );
    }

    // Use schedule's testCenterId if pre-assigned, otherwise use candidate's selection
    const testCenterId = schedule.testCenterId ?? data.testCenterId;

    // Create registration (amount=0 for free exams)
    const registration = await createRegistration(schedule.tenantId, {
      candidateId: session.user.id,
      examScheduleId: scheduleId,
      testCenterId,
      amount: 0,
      notes: data.notes,
    });

    // Auto-confirm for free exams (amount=0)
    if (registration.status !== "WAITING_LIST") {
      await updateRegistration(schedule.tenantId, registration.id, {
        status: "CONFIRMED",
        paymentStatus: "WAIVED",
      });
    }

    // Book seat if selected (graceful — registration succeeds even if seat booking fails)
    let seatBooked = false;
    if (data.seatId) {
      try {
        await bookSeat(schedule.tenantId, {
          registrationId: registration.id,
          seatId: data.seatId,
        });
        seatBooked = true;
      } catch {
        // Seat booking failed (e.g., already taken) — registration still succeeds
      }
    }

    return NextResponse.json(
      { success: true, data: { ...registration, seatBooked } },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
