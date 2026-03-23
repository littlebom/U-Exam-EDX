import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type { Prisma } from "@/generated/prisma";

// ─── Scan Voucher for Check-in ──────────────────────────────────────

export async function checkInByVoucher(
  tenantId: string,
  voucherCode: string,
  examScheduleId: string,
  operatorId?: string
) {
  // Find the voucher
  const voucher = await prisma.voucher.findFirst({
    where: { code: voucherCode },
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      registration: {
        select: {
          id: true,
          status: true,
          seatNumber: true,
          examScheduleId: true,
          testCenterId: true,
          examSchedule: {
            select: {
              id: true,
              startDate: true,
              exam: { select: { title: true } },
            },
          },
          testCenter: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!voucher) throw errors.notFound("ไม่พบ Voucher นี้");

  // Validate voucher
  if (voucher.status === "CANCELLED") {
    throw errors.validation("Voucher นี้ถูกยกเลิกแล้ว");
  }
  if (voucher.status === "EXPIRED") {
    throw errors.validation("Voucher นี้หมดอายุแล้ว");
  }
  if (voucher.isUsed) {
    // Already checked in — return info about existing check-in
    return {
      status: "ALREADY_CHECKED_IN",
      message: "ผู้สอบคนนี้เช็คอินแล้ว",
      candidate: voucher.candidate,
      seatNumber: voucher.registration.seatNumber,
      usedAt: voucher.usedAt,
    };
  }

  // Validate exam schedule matches
  if (voucher.registration.examScheduleId !== examScheduleId) {
    throw errors.validation("Voucher นี้ไม่ตรงกับรอบสอบที่เลือก");
  }

  // Validate registration is confirmed
  if (voucher.registration.status !== "CONFIRMED") {
    throw errors.validation("การสมัครสอบยังไม่ได้รับการยืนยัน");
  }

  // Mark voucher as used (check-in)
  const now = new Date();
  await prisma.voucher.update({
    where: { id: voucher.id },
    data: {
      status: "USED",
      isUsed: true,
      usedAt: now,
    },
  });

  // Determine if late
  const startDate = new Date(voucher.registration.examSchedule.startDate);
  const isLate = now > startDate;

  // Log check-in event
  await prisma.examDayLog.create({
    data: {
      tenantId,
      examScheduleId,
      testCenterId: voucher.registration.testCenterId,
      createdById: operatorId,
      type: isLate ? "LATE_CHECKIN" : "CHECKIN",
      description: `${voucher.candidate.name} เช็คอิน${isLate ? " (มาสาย)" : ""} — ที่นั่ง ${voucher.registration.seatNumber ?? "ไม่ระบุ"}`,
      metadata: {
        candidateId: voucher.candidate.id,
        candidateName: voucher.candidate.name,
        voucherCode: voucher.code,
        seatNumber: voucher.registration.seatNumber,
        isLate,
      },
    },
  });

  return {
    status: isLate ? "LATE" : "SUCCESS",
    message: isLate ? "เช็คอินสำเร็จ (มาสาย)" : "เช็คอินสำเร็จ",
    candidate: voucher.candidate,
    seatNumber: voucher.registration.seatNumber,
    examTitle: voucher.registration.examSchedule.exam.title,
    testCenter: voucher.registration.testCenter,
    checkedInAt: now,
  };
}

// ─── Log Incident ───────────────────────────────────────────────────

export async function logIncident(
  tenantId: string,
  examScheduleId: string,
  data: {
    description: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    testCenterId?: string;
    metadata?: Record<string, unknown>;
  },
  operatorId?: string
) {
  return prisma.examDayLog.create({
    data: {
      tenantId,
      examScheduleId,
      testCenterId: data.testCenterId,
      createdById: operatorId,
      type: "INCIDENT",
      description: data.description,
      severity: data.severity,
      metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });
}

// ─── Get Check-in Dashboard Status ──────────────────────────────────

export async function getCheckInStatus(
  tenantId: string,
  examScheduleId: string
) {
  // Get schedule info
  const schedule = await prisma.examSchedule.findFirst({
    where: { id: examScheduleId, tenantId },
    include: {
      exam: { select: { id: true, title: true } },
    },
  });

  if (!schedule) throw errors.notFound("ไม่พบรอบสอบ");

  // Count registrations vs unique checked-in candidates (from ExamDayLog metadata.candidateId)
  const [totalRegistered, checkinLogs, lateLogs] = await Promise.all([
    prisma.registration.count({
      where: { examScheduleId, tenantId, status: "CONFIRMED" },
    }),
    prisma.examDayLog.findMany({
      where: {
        examScheduleId,
        tenantId,
        type: { in: ["CHECKIN", "LATE_CHECKIN"] },
      },
      select: { metadata: true },
    }),
    prisma.examDayLog.count({
      where: { examScheduleId, tenantId, type: "LATE_CHECKIN" },
    }),
  ]);

  // Count unique candidates (avoid double-counting if scanned multiple times)
  const uniqueCandidates = new Set(
    checkinLogs
      .map((l) => (l.metadata as Record<string, unknown>)?.candidateId)
      .filter(Boolean)
  );
  const checkedInCount = uniqueCandidates.size;
  const lateCount = lateLogs;

  // Get incidents
  const incidentCount = await prisma.examDayLog.count({
    where: { examScheduleId, tenantId, type: "INCIDENT" },
  });

  // Get recent check-in logs (last 10)
  const recentLogs = await prisma.examDayLog.findMany({
    where: {
      examScheduleId,
      tenantId,
      type: { in: ["CHECKIN", "LATE_CHECKIN"] },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Get incidents list
  const incidents = await prisma.examDayLog.findMany({
    where: { examScheduleId, tenantId, type: "INCIDENT" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    schedule: {
      id: schedule.id,
      examTitle: schedule.exam.title,
      startDate: schedule.startDate,
      maxCandidates: schedule.maxCandidates,
    },
    stats: {
      totalRegistered,
      checkedIn: checkedInCount,
      lateCount,
      incidents: incidentCount,
      notCheckedIn: totalRegistered - checkedInCount,
    },
    recentCheckIns: recentLogs.map((log) => ({
      id: log.id,
      type: log.type,
      description: log.description,
      metadata: log.metadata as Record<string, unknown> | null,
      createdAt: log.createdAt,
    })),
    incidents: incidents.map((log) => ({
      id: log.id,
      description: log.description,
      severity: log.severity,
      createdAt: log.createdAt,
    })),
  };
}

// ─── Get Attendance List ─────────────────────────────────────────────

export async function getAttendanceList(
  tenantId: string,
  examScheduleId: string
) {
  // Get all confirmed registrations with voucher status
  const registrations = await prisma.registration.findMany({
    where: { examScheduleId, tenantId, status: "CONFIRMED" },
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      vouchers: {
        select: {
          id: true,
          code: true,
          isUsed: true,
          usedAt: true,
          status: true,
        },
        take: 1,
      },
      testCenter: { select: { id: true, name: true } },
    },
    orderBy: { seatNumber: "asc" },
  });

  return registrations.map((reg) => {
    const voucher = reg.vouchers[0];
    return {
      registrationId: reg.id,
      candidate: reg.candidate,
      seatNumber: reg.seatNumber,
      testCenter: reg.testCenter,
      checkedIn: voucher?.isUsed ?? false,
      checkedInAt: voucher?.usedAt ?? null,
      voucherCode: voucher?.code ?? null,
      voucherStatus: voucher?.status ?? null,
    };
  });
}

// ─── Get Exam Day Logs ──────────────────────────────────────────────

export async function getExamDayLogs(
  tenantId: string,
  examScheduleId: string,
  type?: string
) {
  const where: Record<string, unknown> = { examScheduleId, tenantId };
  if (type) where.type = type;

  return prisma.examDayLog.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// ─── List Exam Schedules for Today (for check-in selection) ─────────

export async function getTodaySchedules(tenantId: string) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  return prisma.examSchedule.findMany({
    where: {
      tenantId,
      startDate: { gte: startOfDay, lt: endOfDay },
      status: { in: ["SCHEDULED", "ACTIVE"] },
    },
    include: {
      exam: { select: { id: true, title: true } },
      _count: {
        select: {
          registrations: {
            where: { status: "CONFIRMED" },
          },
        },
      },
    },
    orderBy: { startDate: "asc" },
  });
}

// ─── Check-in by Face Scan ──────────────────────────────────────────

export async function checkInByFace(
  tenantId: string,
  examScheduleId: string,
  candidateId: string,
  operatorId?: string,
  confidence?: number
) {
  // Find registration for this candidate + schedule
  const registration = await prisma.registration.findFirst({
    where: {
      tenantId,
      examScheduleId,
      candidateId,
      status: "CONFIRMED",
    },
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      examSchedule: {
        select: { id: true, startDate: true, exam: { select: { title: true } } },
      },
      testCenter: { select: { id: true, name: true } },
      vouchers: {
        where: { status: { in: ["VALID", "USED"] } },
        take: 1,
      },
    },
  });

  if (!registration) {
    throw errors.notFound("ไม่พบการสมัครสอบที่ยืนยันแล้วสำหรับผู้สอบคนนี้");
  }

  // Check if already checked in (via voucher)
  const voucher = registration.vouchers[0];
  if (voucher?.isUsed) {
    return {
      status: "ALREADY_CHECKED_IN",
      message: "ผู้สอบคนนี้เช็คอินแล้ว",
      candidate: registration.candidate,
      seatNumber: registration.seatNumber,
      usedAt: voucher.usedAt,
    };
  }

  const now = new Date();

  // Mark voucher as used if exists
  if (voucher) {
    await prisma.voucher.update({
      where: { id: voucher.id },
      data: { status: "USED", isUsed: true, usedAt: now },
    });
  }

  // Determine if late
  const startDate = new Date(registration.examSchedule.startDate);
  const isLate = now > startDate;

  // Log check-in event
  await prisma.examDayLog.create({
    data: {
      tenantId,
      examScheduleId,
      testCenterId: registration.testCenter?.id,
      createdById: operatorId,
      type: isLate ? "LATE_CHECKIN" : "CHECKIN",
      description: `${registration.candidate.name} เช็คอิน (Face Scan)${isLate ? " — มาสาย" : ""} — ที่นั่ง ${registration.seatNumber ?? "ไม่ระบุ"}`,
      metadata: {
        candidateId: registration.candidate.id,
        candidateName: registration.candidate.name,
        seatNumber: registration.seatNumber,
        method: "FACE",
        confidence: confidence ?? null,
        isLate,
      } as Prisma.InputJsonValue,
    },
  });

  return {
    status: isLate ? "LATE" : "SUCCESS",
    message: isLate ? "เช็คอินสำเร็จ (มาสาย)" : "เช็คอินสำเร็จ",
    candidate: registration.candidate,
    seatNumber: registration.seatNumber,
    examTitle: registration.examSchedule.exam.title,
    testCenter: registration.testCenter,
    checkedInAt: now,
    method: "FACE",
  };
}
