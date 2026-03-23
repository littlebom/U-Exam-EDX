import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { buildPaginationMeta } from "@/types";
import type { WaitingListFilter } from "@/lib/validations/voucher";

// ═══════════════════════════════════════════════════════════════════
// Waiting List Service
// Uses Registration model with status = WAITING_LIST
// ═══════════════════════════════════════════════════════════════════

/**
 * List registrations with WAITING_LIST status, ordered by waitingListOrder.
 */
export async function listWaitingList(tenantId: string, filters: WaitingListFilter) {
  const { examScheduleId, search, page, perPage } = filters;

  const where: Record<string, unknown> = {
    tenantId,
    status: "WAITING_LIST",
    ...(examScheduleId && { examScheduleId }),
  };

  if (search) {
    where.OR = [
      { candidate: { name: { contains: search, mode: "insensitive" } } },
      { candidate: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.registration.findMany({
      where: where as any,
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        examSchedule: {
          select: {
            id: true,
            startDate: true,
            maxCandidates: true,
            location: true,
            exam: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: [{ waitingListOrder: "asc" }, { createdAt: "asc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.registration.count({ where: where as any }),
  ]);

  return {
    data,
    meta: buildPaginationMeta(page, perPage, total),
  };
}

/**
 * Get waiting list stats.
 */
export async function getWaitingListStats(tenantId: string) {
  const [total, bySchedule] = await Promise.all([
    prisma.registration.count({
      where: { tenantId, status: "WAITING_LIST" },
    }),
    prisma.registration.groupBy({
      by: ["examScheduleId"],
      where: { tenantId, status: "WAITING_LIST" },
      _count: { id: true },
    }),
  ]);

  return { total, byScheduleCount: bySchedule.length };
}

/**
 * Promote the next person from waiting list to PENDING status.
 * Called when a CONFIRMED registration is cancelled and a spot opens up.
 */
export async function promoteFromWaitingList(
  tenantId: string,
  examScheduleId: string
) {
  // Check if there's capacity now
  const schedule = await prisma.examSchedule.findFirst({
    where: { id: examScheduleId, tenantId },
  });
  if (!schedule) throw errors.notFound("ไม่พบรอบสอบ");

  const confirmedCount = await prisma.registration.count({
    where: {
      examScheduleId,
      status: { in: ["CONFIRMED", "PENDING"] },
    },
  });

  const maxCandidates = schedule.maxCandidates ?? Infinity;
  if (confirmedCount >= maxCandidates) {
    return { promoted: false, message: "ยังไม่มีที่ว่าง" };
  }

  // Get first person on waiting list
  const nextInLine = await prisma.registration.findFirst({
    where: {
      tenantId,
      examScheduleId,
      status: "WAITING_LIST",
    },
    orderBy: [{ waitingListOrder: "asc" }, { createdAt: "asc" }],
    include: {
      candidate: { select: { id: true, name: true, email: true } },
    },
  });

  if (!nextInLine) {
    return { promoted: false, message: "ไม่มีผู้รอในคิว" };
  }

  // Promote to PENDING
  const promoted = await prisma.registration.update({
    where: { id: nextInLine.id },
    data: {
      status: "PENDING",
      waitingListOrder: null,
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

  // Reorder remaining waiting list
  const remaining = await prisma.registration.findMany({
    where: {
      tenantId,
      examScheduleId,
      status: "WAITING_LIST",
    },
    orderBy: [{ waitingListOrder: "asc" }, { createdAt: "asc" }],
  });

  for (let i = 0; i < remaining.length; i++) {
    await prisma.registration.update({
      where: { id: remaining[i].id },
      data: { waitingListOrder: i + 1 },
    });
  }

  return { promoted: true, registration: promoted };
}

/**
 * Cancel a registration and auto-promote from waiting list.
 */
export async function cancelRegistrationWithPromotion(
  tenantId: string,
  registrationId: string,
  reason?: string
) {
  const registration = await prisma.registration.findFirst({
    where: { id: registrationId, tenantId },
  });
  if (!registration) throw errors.notFound("ไม่พบการสมัครสอบ");

  if (registration.status === "CANCELLED") {
    throw errors.validation("การสมัครนี้ถูกยกเลิกแล้ว");
  }

  const wasConfirmedOrPending = ["CONFIRMED", "PENDING"].includes(registration.status);

  // Cancel the registration
  const cancelled = await prisma.registration.update({
    where: { id: registrationId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      notes: reason ? `${registration.notes ? registration.notes + " | " : ""}ยกเลิก: ${reason}` : registration.notes,
    },
  });

  // Cancel associated vouchers
  await prisma.voucher.updateMany({
    where: {
      registrationId,
      status: "VALID",
    },
    data: { status: "CANCELLED" },
  });

  // If a confirmed/pending spot was freed, promote from waiting list
  let promotionResult = null;
  if (wasConfirmedOrPending) {
    promotionResult = await promoteFromWaitingList(tenantId, registration.examScheduleId);
  }

  return { cancelled, promotion: promotionResult };
}

/**
 * Reschedule a registration to a different exam schedule.
 */
export async function rescheduleRegistration(
  tenantId: string,
  registrationId: string,
  newExamScheduleId: string
) {
  const registration = await prisma.registration.findFirst({
    where: { id: registrationId, tenantId },
  });
  if (!registration) throw errors.notFound("ไม่พบการสมัครสอบ");

  if (!["PENDING", "CONFIRMED"].includes(registration.status)) {
    throw errors.validation("สามารถเปลี่ยนรอบสอบได้เฉพาะสถานะ PENDING หรือ CONFIRMED");
  }

  // Verify new schedule exists
  const newSchedule = await prisma.examSchedule.findFirst({
    where: { id: newExamScheduleId, tenantId, status: { in: ["SCHEDULED", "ACTIVE"] } },
    include: { exam: { select: { title: true } } },
  });
  if (!newSchedule) throw errors.notFound("ไม่พบรอบสอบใหม่");

  // Check capacity
  const confirmedCount = await prisma.registration.count({
    where: {
      examScheduleId: newExamScheduleId,
      status: { in: ["CONFIRMED", "PENDING"] },
    },
  });

  const maxCandidates = newSchedule.maxCandidates ?? Infinity;
  const isWaitingList = confirmedCount >= maxCandidates;

  // Release seat from old registration
  const updateData: Record<string, unknown> = {
    examScheduleId: newExamScheduleId,
    seatId: null,
    seatNumber: null,
    testCenterId: null,
    status: isWaitingList ? "WAITING_LIST" : "PENDING",
    waitingListOrder: isWaitingList ? confirmedCount - maxCandidates + 1 : null,
    confirmedAt: null,
  };

  const updated = await prisma.registration.update({
    where: { id: registrationId },
    data: updateData,
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      examSchedule: {
        select: {
          id: true,
          startDate: true,
          exam: { select: { title: true } },
        },
      },
    },
  });

  // Cancel old vouchers
  await prisma.voucher.updateMany({
    where: { registrationId, status: "VALID" },
    data: { status: "CANCELLED" },
  });

  // Auto-promote from waiting list of old schedule
  await promoteFromWaitingList(tenantId, registration.examScheduleId);

  return updated;
}
