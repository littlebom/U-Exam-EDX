import { prisma } from "@/lib/prisma";

// ─── Center Utilization Rate ────────────────────────────────────────

export async function getCenterUtilization(
  tenantId: string,
  testCenterId: string
) {
  // Get total seats in center
  const totalSeats = await prisma.seat.count({
    where: { room: { testCenterId }, status: { not: "DISABLED" } },
  });

  // Get total exam sessions conducted
  const totalSessions = await prisma.examSchedule.count({
    where: {
      tenantId,
      registrations: { some: { testCenterId } },
      status: { in: ["ACTIVE", "COMPLETED"] },
    },
  });

  // Get total registrations for this center
  const totalRegistrations = await prisma.registration.count({
    where: { tenantId, testCenterId, status: "CONFIRMED" },
  });

  // Get total check-ins at this center
  const totalCheckIns = await prisma.examDayLog.count({
    where: {
      tenantId,
      testCenterId,
      type: { in: ["CHECKIN", "LATE_CHECKIN"] },
    },
  });

  // Get incident count
  const incidentCount = await prisma.examDayLog.count({
    where: { tenantId, testCenterId, type: "INCIDENT" },
  });

  // Room utilization
  const rooms = await prisma.room.findMany({
    where: { testCenterId },
    select: {
      id: true,
      name: true,
      capacity: true,
      status: true,
    },
  });

  const availableRooms = rooms.filter((r) => r.status === "AVAILABLE").length;

  return {
    totalSeats,
    totalSessions,
    totalRegistrations,
    totalCheckIns,
    incidentCount,
    rooms: {
      total: rooms.length,
      available: availableRooms,
      utilizationRate: rooms.length > 0
        ? Math.round((availableRooms / rooms.length) * 100)
        : 0,
    },
    seatUtilizationRate:
      totalSeats > 0 && totalSessions > 0
        ? Math.round((totalRegistrations / (totalSeats * totalSessions)) * 100)
        : 0,
  };
}

// ─── Center Exam History ────────────────────────────────────────────

export async function getCenterExamHistory(
  tenantId: string,
  testCenterId: string,
  limit = 20
) {
  // Get exam schedules associated with this center via registrations
  const schedules = await prisma.examSchedule.findMany({
    where: {
      tenantId,
      registrations: { some: { testCenterId } },
    },
    include: {
      exam: { select: { id: true, title: true } },
      _count: {
        select: {
          registrations: { where: { testCenterId, status: "CONFIRMED" } },
        },
      },
    },
    orderBy: { startDate: "desc" },
    take: limit,
  });

  return schedules.map((s) => ({
    id: s.id,
    examTitle: s.exam.title,
    startDate: s.startDate,
    endDate: s.endDate,
    status: s.status,
    registrations: s._count.registrations,
    maxCandidates: s.maxCandidates,
  }));
}

// ─── Staff Performance ──────────────────────────────────────────────

export async function getCenterStaffPerformance(
  tenantId: string,
  testCenterId: string,
  page = 1,
  perPage = 20
) {
  const staff = await prisma.centerStaff.findMany({
    where: { testCenterId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      shifts: {
        orderBy: { date: "desc" },
        take: 10,
      },
    },
    skip: (page - 1) * perPage,
    take: perPage,
  });

  return staff.map((s) => ({
    id: s.id,
    user: s.user,
    position: s.position,
    status: s.status,
    totalShifts: s.shifts.length,
    recentShifts: s.shifts.map((shift) => ({
      id: shift.id,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      role: shift.role,
    })),
  }));
}

// ─── Center Overview (aggregated) ───────────────────────────────────

export async function getCenterOverview(tenantId: string) {
  const [
    totalCenters,
    activeCenters,
    maintenanceCenters,
    totalRooms,
    totalSeats,
    totalEquipment,
    workingEquipment,
  ] = await Promise.all([
    prisma.testCenter.count({ where: { tenantId } }),
    prisma.testCenter.count({ where: { tenantId, status: "ACTIVE" } }),
    prisma.testCenter.count({ where: { tenantId, status: "MAINTENANCE" } }),
    prisma.room.count({ where: { testCenter: { tenantId } } }),
    prisma.seat.count({ where: { room: { testCenter: { tenantId } } } }),
    prisma.equipment.count({ where: { testCenter: { tenantId } } }),
    prisma.equipment.count({ where: { testCenter: { tenantId }, status: "WORKING" } }),
  ]);

  // Pending approvals
  const pendingApprovals = await prisma.centerApproval.count({
    where: { tenantId, status: { in: ["PENDING", "IN_REVIEW"] } },
  });

  return {
    totalCenters,
    activeCenters,
    maintenanceCenters,
    inactiveCenters: totalCenters - activeCenters - maintenanceCenters,
    totalRooms,
    totalSeats,
    totalEquipment,
    workingEquipment,
    equipmentHealthRate: totalEquipment > 0
      ? Math.round((workingEquipment / totalEquipment) * 100)
      : 100,
    pendingApprovals,
  };
}
