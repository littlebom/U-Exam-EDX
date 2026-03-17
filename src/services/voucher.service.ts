import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type {
  CreateVoucher,
  VoucherFilter,
} from "@/lib/validations/voucher";

// ═══════════════════════════════════════════════════════════════════
// Voucher CRUD
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate a unique voucher code: VCH-YYYY-XXXX
 */
function generateVoucherCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit
  return `VCH-${year}-${String(random).padStart(4, "0")}`;
}

/**
 * List vouchers with pagination and filters.
 */
export async function listVouchers(tenantId: string, filters: VoucherFilter) {
  const { status, examScheduleId, candidateId, search, page, perPage } = filters;

  const where: Record<string, unknown> = {
    tenantId,
    ...(status && { status }),
    ...(candidateId && { candidateId }),
  };

  if (examScheduleId) {
    where.registration = { examScheduleId };
  }

  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { candidate: { name: { contains: search, mode: "insensitive" } } },
      { candidate: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.voucher.findMany({
      where: where as any,
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        registration: {
          select: {
            id: true,
            seatNumber: true,
            status: true,
            examSchedule: {
              select: {
                id: true,
                startDate: true,
                location: true,
                exam: { select: { id: true, title: true } },
              },
            },
            testCenter: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.voucher.count({ where: where as any }),
  ]);

  return {
    data,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  };
}

/**
 * Get a single voucher by ID.
 */
export async function getVoucher(tenantId: string, id: string) {
  const voucher = await prisma.voucher.findFirst({
    where: { id, tenantId },
    include: {
      candidate: { select: { id: true, name: true, email: true, phone: true } },
      registration: {
        select: {
          id: true,
          seatNumber: true,
          status: true,
          examSchedule: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              location: true,
              exam: { select: { id: true, title: true, duration: true } },
            },
          },
          testCenter: { select: { id: true, name: true, address: true } },
        },
      },
    },
  });

  if (!voucher) throw errors.notFound("ไม่พบบัตรเข้าสอบ");
  return voucher;
}

/**
 * Create a voucher for a confirmed registration.
 */
export async function createVoucher(tenantId: string, data: CreateVoucher) {
  const registration = await prisma.registration.findFirst({
    where: { id: data.registrationId, tenantId },
    include: { candidate: { select: { id: true } } },
  });
  if (!registration) throw errors.notFound("ไม่พบการสมัครสอบ");

  // Only CONFIRMED registrations can get vouchers
  if (registration.status !== "CONFIRMED") {
    throw errors.validation("สามารถออกบัตรเข้าสอบได้เฉพาะการสมัครที่ยืนยันแล้ว");
  }

  // Check if voucher already exists for this registration
  const existing = await prisma.voucher.findFirst({
    where: {
      registrationId: data.registrationId,
      status: { in: ["VALID", "USED"] },
    },
  });
  if (existing) throw errors.conflict("มีบัตรเข้าสอบสำหรับการสมัครนี้แล้ว");

  // Generate unique voucher code
  let code = generateVoucherCode();
  let attempts = 0;
  while (attempts < 10) {
    const exists = await prisma.voucher.findUnique({ where: { code } });
    if (!exists) break;
    code = generateVoucherCode();
    attempts++;
  }

  // QR data includes voucher code and registration info
  const qrData = JSON.stringify({
    code,
    registrationId: registration.id,
    candidateId: registration.candidateId,
  });

  return prisma.voucher.create({
    data: {
      tenantId,
      registrationId: registration.id,
      candidateId: registration.candidateId,
      code,
      qrData,
      status: "VALID",
    },
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      registration: {
        select: {
          id: true,
          seatNumber: true,
          examSchedule: {
            select: {
              id: true,
              startDate: true,
              exam: { select: { title: true } },
            },
          },
        },
      },
    },
  });
}

/**
 * Validate a voucher by code (for check-in).
 */
export async function validateVoucher(code: string) {
  const voucher = await prisma.voucher.findUnique({
    where: { code },
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      registration: {
        select: {
          id: true,
          seatNumber: true,
          status: true,
          examSchedule: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              exam: { select: { title: true } },
            },
          },
          testCenter: { select: { name: true } },
        },
      },
    },
  });

  if (!voucher) throw errors.notFound("ไม่พบบัตรเข้าสอบ");

  return {
    voucher,
    isValid: voucher.status === "VALID" && !voucher.isUsed,
    message:
      voucher.status === "USED"
        ? "บัตรเข้าสอบนี้ถูกใช้แล้ว"
        : voucher.status === "EXPIRED"
          ? "บัตรเข้าสอบนี้หมดอายุ"
          : voucher.status === "CANCELLED"
            ? "บัตรเข้าสอบนี้ถูกยกเลิก"
            : "บัตรเข้าสอบใช้งานได้",
  };
}

/**
 * Mark a voucher as used (check-in).
 */
export async function useVoucher(tenantId: string, id: string) {
  const voucher = await prisma.voucher.findFirst({
    where: { id, tenantId },
  });
  if (!voucher) throw errors.notFound("ไม่พบบัตรเข้าสอบ");

  if (voucher.status !== "VALID") {
    throw errors.validation("บัตรเข้าสอบนี้ไม่สามารถใช้งานได้");
  }

  return prisma.voucher.update({
    where: { id },
    data: {
      status: "USED",
      isUsed: true,
      usedAt: new Date(),
    },
  });
}

/**
 * Cancel a voucher.
 */
export async function cancelVoucher(tenantId: string, id: string) {
  const voucher = await prisma.voucher.findFirst({
    where: { id, tenantId },
  });
  if (!voucher) throw errors.notFound("ไม่พบบัตรเข้าสอบ");

  return prisma.voucher.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}

/**
 * Bulk generate vouchers for all confirmed registrations of an exam schedule.
 */
export async function bulkGenerateVouchers(tenantId: string, examScheduleId: string) {
  // Find all confirmed registrations without valid vouchers
  const registrations = await prisma.registration.findMany({
    where: {
      tenantId,
      examScheduleId,
      status: "CONFIRMED",
      vouchers: {
        none: { status: { in: ["VALID", "USED"] } },
      },
    },
    select: { id: true, candidateId: true },
  });

  let created = 0;
  for (const reg of registrations) {
    let code = generateVoucherCode();
    let attempts = 0;
    while (attempts < 10) {
      const exists = await prisma.voucher.findUnique({ where: { code } });
      if (!exists) break;
      code = generateVoucherCode();
      attempts++;
    }

    const qrData = JSON.stringify({
      code,
      registrationId: reg.id,
      candidateId: reg.candidateId,
    });

    await prisma.voucher.create({
      data: {
        tenantId,
        registrationId: reg.id,
        candidateId: reg.candidateId,
        code,
        qrData,
        status: "VALID",
      },
    });
    created++;
  }

  return { created, total: registrations.length };
}
