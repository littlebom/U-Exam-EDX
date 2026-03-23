import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type { Prisma } from "@/generated/prisma";
import type {
  CreateRegistration,
  UpdateRegistration,
  RegistrationFilter,
  CatalogFilter,
} from "@/lib/validations/registration";

// ═══════════════════════════════════════════════════════════════════
// Registration CRUD
// ═══════════════════════════════════════════════════════════════════

export async function listRegistrations(tenantId: string, filters: RegistrationFilter) {
  const { status, paymentStatus, examScheduleId, candidateId, search, page, perPage } = filters;

  const where: Record<string, unknown> = {
    tenantId,
    ...(status && { status }),
    ...(paymentStatus && { paymentStatus }),
    ...(examScheduleId && { examScheduleId }),
    ...(candidateId && { candidateId }),
  };

  if (search) {
    where.OR = [
      { candidate: { name: { contains: search, mode: "insensitive" } } },
      { candidate: { email: { contains: search, mode: "insensitive" } } },
      { examSchedule: { exam: { title: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.registration.findMany({
      where: where as Prisma.RegistrationWhereInput,
      include: {
        candidate: { select: { id: true, name: true, email: true } },
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
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.registration.count({ where: where as Prisma.RegistrationWhereInput }),
  ]);

  return {
    data,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  };
}

export async function getRegistration(tenantId: string, id: string) {
  const reg = await prisma.registration.findFirst({
    where: { id, tenantId },
    include: {
      candidate: { select: { id: true, name: true, email: true, phone: true } },
      examSchedule: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          location: true,
          exam: { select: { id: true, title: true, duration: true, passingScore: true } },
        },
      },
      testCenter: { select: { id: true, name: true, address: true } },
    },
  });

  if (!reg) throw errors.notFound("ไม่พบการสมัครสอบ");
  return reg;
}

export async function createRegistration(tenantId: string, data: CreateRegistration) {
  // Verify exam schedule belongs to tenant
  const schedule = await prisma.examSchedule.findFirst({
    where: { id: data.examScheduleId, tenantId },
    include: { exam: { select: { title: true } } },
  });
  if (!schedule) throw errors.notFound("ไม่พบรอบสอบ");

  // Verify candidate exists
  const candidate = await prisma.user.findUnique({ where: { id: data.candidateId } });
  if (!candidate) throw errors.notFound("ไม่พบผู้สมัคร");

  // Check if already registered
  const existing = await prisma.registration.findFirst({
    where: {
      tenantId,
      candidateId: data.candidateId,
      examScheduleId: data.examScheduleId,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });
  if (existing) throw errors.conflict("ผู้สมัครนี้ลงทะเบียนรอบนี้แล้ว");

  // Check capacity
  const confirmedCount = await prisma.registration.count({
    where: {
      examScheduleId: data.examScheduleId,
      status: { in: ["CONFIRMED"] },
    },
  });

  const maxCandidates = schedule.maxCandidates ?? Infinity;
  const isWaitingList = confirmedCount >= maxCandidates;

  // Use schedule's registration fee if no amount specified, or amount is 0
  const registrationAmount = data.amount > 0 ? data.amount : schedule.registrationFee;

  return prisma.registration.create({
    data: {
      tenantId,
      candidateId: data.candidateId,
      examScheduleId: data.examScheduleId,
      testCenterId: data.testCenterId,
      amount: registrationAmount,
      notes: data.notes,
      status: isWaitingList ? "WAITING_LIST" : "PENDING",
      waitingListOrder: isWaitingList ? confirmedCount - maxCandidates + 1 : null,
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
}

export async function updateRegistration(tenantId: string, id: string, data: UpdateRegistration) {
  const existing = await prisma.registration.findFirst({
    where: { id, tenantId },
  });
  if (!existing) throw errors.notFound("ไม่พบการสมัครสอบ");

  const updateData: Record<string, unknown> = { ...data };
  if (data.status === "CONFIRMED" && !existing.confirmedAt) {
    updateData.confirmedAt = new Date();
  }
  if (data.status === "CANCELLED" && !existing.cancelledAt) {
    updateData.cancelledAt = new Date();
  }

  const result = await prisma.registration.update({
    where: { id },
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

  // ─── Send notification on status change ───
  if (data.status && data.status !== existing.status) {
    const examTitle = result.examSchedule?.exam?.title ?? "สอบ";
    const candidateId = result.candidateId;

    const statusMessages: Record<string, { type: string; title: string; message: string }> = {
      CONFIRMED: {
        type: "REGISTRATION_APPROVED",
        title: "สมัครสอบได้รับอนุมัติ",
        message: `การสมัครสอบวิชา "${examTitle}" ได้รับการอนุมัติแล้ว`,
      },
      WAITING_LIST: {
        type: "REGISTRATION_APPROVED",
        title: "อยู่ในรายชื่อสำรอง",
        message: `การสมัครสอบวิชา "${examTitle}" อยู่ในรายชื่อสำรอง ระบบจะแจ้งเมื่อมีที่ว่าง`,
      },
      CANCELLED: {
        type: "REGISTRATION_APPROVED",
        title: "การสมัครสอบถูกยกเลิก",
        message: `การสมัครสอบวิชา "${examTitle}" ถูกยกเลิก`,
      },
    };

    const notif = statusMessages[data.status];
    if (notif) {
      // Audit log
      import("@/services/audit-log.service").then(({ logAdminAction }) =>
        logAdminAction(
          data.status === "CONFIRMED" ? "REGISTRATION_APPROVE" : "REGISTRATION_CANCEL",
          { userId: candidateId, tenantId, target: `Registration:${id}`, detail: { status: data.status, examTitle } }
        )
      );

      import("@/services/notification.service").then(({ sendNotification }) =>
        sendNotification({
          tenantId,
          userId: candidateId,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          link: "/profile/registrations",
        }).catch((err) => console.error("[registration-notification]", err))
      );
    }
  }

  return result;
}

export async function deleteRegistration(tenantId: string, id: string) {
  const existing = await prisma.registration.findFirst({
    where: { id, tenantId },
  });
  if (!existing) throw errors.notFound("ไม่พบการสมัครสอบ");

  return prisma.registration.delete({ where: { id } });
}

// ─── Registration Stats ─────────────────────────────────────────────

export async function getRegistrationStats(tenantId: string) {
  const [total, confirmed, pending, cancelled, waitingList] = await Promise.all([
    prisma.registration.count({ where: { tenantId } }),
    prisma.registration.count({ where: { tenantId, status: "CONFIRMED" } }),
    prisma.registration.count({ where: { tenantId, status: "PENDING" } }),
    prisma.registration.count({ where: { tenantId, status: "CANCELLED" } }),
    prisma.registration.count({ where: { tenantId, status: "WAITING_LIST" } }),
  ]);

  return { total, confirmed, pending, cancelled, waitingList };
}

// ═══════════════════════════════════════════════════════════════════
// Public Catalog (for exam browsing)
// ═══════════════════════════════════════════════════════════════════

export async function listCatalog(filters: CatalogFilter) {
  const { search, status, page, perPage } = filters;

  // Get published exams with upcoming schedules
  const now = new Date();

  const where: Record<string, unknown> = {
    status: { in: ["SCHEDULED", "ACTIVE"] },
    startDate: { gte: now },
    exam: {
      status: { in: ["PUBLISHED", "ACTIVE"] },
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
  };

  const [data, total] = await Promise.all([
    prisma.examSchedule.findMany({
      where: where as Prisma.RegistrationWhereInput,
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
        _count: {
          select: {
            registrations: { where: { status: { in: ["CONFIRMED"] } } },
          },
        },
      },
      orderBy: { startDate: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.examSchedule.count({ where: where as Prisma.ExamScheduleWhereInput }),
  ]);

  return {
    data,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  };
}
