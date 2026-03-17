import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type {
  BookSeat,
  SeatAvailabilityFilter,
} from "@/lib/validations/seat-booking";

// ═══════════════════════════════════════════════════════════════════
// Seat Availability
// ═══════════════════════════════════════════════════════════════════

/**
 * Get available seats for a specific exam schedule + test center + room.
 * Returns only AVAILABLE seats (excluding OCCUPIED, DISABLED, RESERVED).
 * Also marks seats as "booked" if they're assigned to an active registration.
 */
export async function getAvailableSeats(
  tenantId: string,
  filters: SeatAvailabilityFilter
) {
  const { examScheduleId, testCenterId, roomId } = filters;

  // Verify schedule belongs to tenant
  const schedule = await prisma.examSchedule.findFirst({
    where: { id: examScheduleId, tenantId },
    select: { id: true, startDate: true, maxCandidates: true },
  });
  if (!schedule) throw errors.notFound("ไม่พบรอบสอบ");

  // Build room filter
  const roomWhere: Record<string, unknown> = {
    testCenter: { tenantId },
  };
  if (roomId) {
    roomWhere.id = roomId;
  }
  if (testCenterId) {
    roomWhere.testCenterId = testCenterId;
  }

  // Get rooms with seats
  const rooms = await prisma.room.findMany({
    where: roomWhere as any,
    include: {
      seats: {
        orderBy: [{ row: "asc" }, { column: "asc" }],
      },
      testCenter: { select: { id: true, name: true } },
    },
  });

  // Get already-booked seat IDs for this exam schedule
  const bookedRegistrations = await prisma.registration.findMany({
    where: {
      examScheduleId,
      status: { in: ["PENDING", "CONFIRMED"] },
      seatId: { not: null },
    },
    select: { seatId: true },
  });
  const bookedSeatIds = new Set(bookedRegistrations.map((r) => r.seatId));

  // Map seats with booking status
  const result = rooms.map((room) => {
    const seats = room.seats.map((seat) => ({
      ...seat,
      isBooked: bookedSeatIds.has(seat.id),
      isAvailable: seat.status === "AVAILABLE" && !bookedSeatIds.has(seat.id),
    }));

    const totalSeats = seats.length;
    const availableSeats = seats.filter((s) => s.isAvailable).length;
    const bookedSeats = seats.filter((s) => s.isBooked).length;
    const disabledSeats = seats.filter(
      (s) => s.status === "DISABLED" || s.status === "RESERVED"
    ).length;

    return {
      room: {
        id: room.id,
        name: room.name,
        floor: room.floor,
        capacity: room.capacity,
        testCenter: room.testCenter,
      },
      seats,
      stats: {
        total: totalSeats,
        available: availableSeats,
        booked: bookedSeats,
        disabled: disabledSeats,
      },
    };
  });

  return { data: result };
}

// ═══════════════════════════════════════════════════════════════════
// Seat Booking (assign seat to registration)
// ═══════════════════════════════════════════════════════════════════

/**
 * Book a seat for a specific registration.
 * Validates seat availability and prevents double-booking.
 */
export async function bookSeat(tenantId: string, data: BookSeat) {
  const { registrationId, seatId } = data;

  // Verify registration belongs to tenant
  const registration = await prisma.registration.findFirst({
    where: { id: registrationId, tenantId },
  });
  if (!registration) throw errors.notFound("ไม่พบการสมัครสอบ");

  // Only PENDING/CONFIRMED registrations can book seats
  if (!["PENDING", "CONFIRMED"].includes(registration.status)) {
    throw errors.validation("สถานะการสมัครไม่อนุญาตให้จองที่นั่ง");
  }

  // Verify seat exists and is available
  const seat = await prisma.seat.findFirst({
    where: { id: seatId },
    include: {
      room: {
        include: {
          testCenter: { select: { id: true, tenantId: true, name: true } },
        },
      },
    },
  });
  if (!seat) throw errors.notFound("ไม่พบที่นั่ง");

  // Ensure the seat's test center belongs to the tenant
  if (seat.room.testCenter.tenantId !== tenantId) {
    throw errors.forbidden("ไม่มีสิทธิ์จองที่นั่งในศูนย์สอบนี้");
  }

  // Check seat is AVAILABLE (not DISABLED or RESERVED by admin)
  if (seat.status !== "AVAILABLE") {
    throw errors.validation("ที่นั่งนี้ไม่พร้อมใช้งาน");
  }

  // Check if seat is already booked for this exam schedule
  const existingBooking = await prisma.registration.findFirst({
    where: {
      seatId,
      examScheduleId: registration.examScheduleId,
      status: { in: ["PENDING", "CONFIRMED"] },
      id: { not: registrationId }, // Exclude current registration
    },
  });
  if (existingBooking) {
    throw errors.conflict("ที่นั่งนี้ถูกจองแล้ว");
  }

  // Update registration with seat info
  const updated = await prisma.registration.update({
    where: { id: registrationId },
    data: {
      seatId: seat.id,
      seatNumber: seat.seatNumber,
      testCenterId: seat.room.testCenter.id,
    },
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      examSchedule: {
        select: {
          id: true,
          exam: { select: { title: true } },
        },
      },
      testCenter: { select: { id: true, name: true } },
      seat: { select: { id: true, seatNumber: true, type: true } },
    },
  });

  return updated;
}

/**
 * Release a seat from a registration (e.g. on cancellation or seat swap).
 */
export async function releaseSeat(tenantId: string, registrationId: string) {
  const registration = await prisma.registration.findFirst({
    where: { id: registrationId, tenantId },
  });
  if (!registration) throw errors.notFound("ไม่พบการสมัครสอบ");

  if (!registration.seatId) {
    throw errors.validation("การสมัครนี้ไม่ได้จองที่นั่ง");
  }

  // Clear seat assignment
  const updated = await prisma.registration.update({
    where: { id: registrationId },
    data: {
      seatId: null,
      seatNumber: null,
    },
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      examSchedule: {
        select: {
          id: true,
          exam: { select: { title: true } },
        },
      },
    },
  });

  return updated;
}

/**
 * Swap seats between two registrations for the same exam schedule.
 */
export async function swapSeats(
  tenantId: string,
  registrationId1: string,
  registrationId2: string
) {
  const [reg1, reg2] = await Promise.all([
    prisma.registration.findFirst({
      where: { id: registrationId1, tenantId },
    }),
    prisma.registration.findFirst({
      where: { id: registrationId2, tenantId },
    }),
  ]);

  if (!reg1 || !reg2) throw errors.notFound("ไม่พบการสมัครสอบ");

  // Must be same exam schedule
  if (reg1.examScheduleId !== reg2.examScheduleId) {
    throw errors.validation("สามารถสลับที่นั่งได้เฉพาะรอบสอบเดียวกัน");
  }

  // Both must have seats
  if (!reg1.seatId || !reg2.seatId) {
    throw errors.validation("ทั้งสองรายการต้องมีที่นั่ง");
  }

  // Swap using transaction
  const [updated1, updated2] = await prisma.$transaction([
    prisma.registration.update({
      where: { id: registrationId1 },
      data: { seatId: reg2.seatId, seatNumber: reg2.seatNumber },
    }),
    prisma.registration.update({
      where: { id: registrationId2 },
      data: { seatId: reg1.seatId, seatNumber: reg1.seatNumber },
    }),
  ]);

  return { registration1: updated1, registration2: updated2 };
}

/**
 * Auto-assign available seats to registrations that don't have seats yet.
 * Assigns in order of registration date (FIFO).
 */
export async function autoAssignSeats(
  tenantId: string,
  examScheduleId: string,
  roomId: string
) {
  // Get unassigned registrations for this schedule (ordered by creation date)
  const unassigned = await prisma.registration.findMany({
    where: {
      tenantId,
      examScheduleId,
      status: { in: ["PENDING", "CONFIRMED"] },
      seatId: null,
    },
    orderBy: { createdAt: "asc" },
  });

  if (unassigned.length === 0) {
    return { assigned: 0, total: 0 };
  }

  // Get available seats for this room
  const bookedSeatIds = await prisma.registration.findMany({
    where: {
      examScheduleId,
      status: { in: ["PENDING", "CONFIRMED"] },
      seatId: { not: null },
    },
    select: { seatId: true },
  });
  const bookedSet = new Set(bookedSeatIds.map((r) => r.seatId));

  const availableSeats = await prisma.seat.findMany({
    where: {
      roomId,
      status: "AVAILABLE",
      id: { notIn: [...bookedSet].filter(Boolean) as string[] },
    },
    orderBy: [{ row: "asc" }, { column: "asc" }],
  });

  // Assign seats in order
  let assigned = 0;
  const limit = Math.min(unassigned.length, availableSeats.length);

  for (let i = 0; i < limit; i++) {
    const reg = unassigned[i];
    const seat = availableSeats[i];

    await prisma.registration.update({
      where: { id: reg.id },
      data: {
        seatId: seat.id,
        seatNumber: seat.seatNumber,
      },
    });
    assigned++;
  }

  return {
    assigned,
    total: unassigned.length,
    remaining: unassigned.length - assigned,
  };
}
