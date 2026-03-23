import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { buildPaginationMeta } from "@/types";
import type {
  CreateCenterStaff,
  UpdateCenterStaff,
  CenterStaffFilter,
  CreateStaffShift,
  UpdateStaffShift,
  StaffShiftFilter,
} from "@/lib/validations/center-staff";

// ═══════════════════════════════════════════════════════════════════
// CenterStaff CRUD
// ═══════════════════════════════════════════════════════════════════

export async function listCenterStaff(tenantId: string, filters: CenterStaffFilter) {
  const { testCenterId, position, status, page, perPage } = filters;

  const where = {
    testCenter: { tenantId },
    ...(testCenterId && { testCenterId }),
    ...(position && { position }),
    ...(status && { status }),
  };

  const [data, total] = await Promise.all([
    prisma.centerStaff.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, imageUrl: true, phone: true } },
        testCenter: { select: { id: true, name: true } },
        shifts: {
          where: { date: { gte: new Date() } },
          orderBy: { date: "asc" },
          take: 1,
          select: { id: true, date: true, startTime: true, endTime: true, role: true },
        },
      },
      orderBy: [{ testCenter: { name: "asc" } }, { user: { name: "asc" } }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.centerStaff.count({ where }),
  ]);

  return {
    data,
    meta: buildPaginationMeta(page, perPage, total),
  };
}

export async function getCenterStaff(tenantId: string, id: string) {
  const staff = await prisma.centerStaff.findFirst({
    where: { id, testCenter: { tenantId } },
    include: {
      user: { select: { id: true, name: true, email: true, imageUrl: true, phone: true } },
      testCenter: { select: { id: true, name: true } },
      shifts: {
        orderBy: { date: "desc" },
        take: 10,
      },
    },
  });

  if (!staff) throw errors.notFound("ไม่พบบุคลากร");
  return staff;
}

export async function createCenterStaff(tenantId: string, data: CreateCenterStaff) {
  // Verify test center belongs to tenant
  const center = await prisma.testCenter.findFirst({
    where: { id: data.testCenterId, tenantId },
  });
  if (!center) throw errors.notFound("ไม่พบศูนย์สอบ");

  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!user) throw errors.notFound("ไม่พบผู้ใช้");

  return prisma.centerStaff.create({
    data,
    include: {
      user: { select: { id: true, name: true, email: true } },
      testCenter: { select: { id: true, name: true } },
    },
  });
}

export async function updateCenterStaff(tenantId: string, id: string, data: UpdateCenterStaff) {
  const existing = await prisma.centerStaff.findFirst({
    where: { id, testCenter: { tenantId } },
  });
  if (!existing) throw errors.notFound("ไม่พบบุคลากร");

  return prisma.centerStaff.update({
    where: { id },
    data,
    include: {
      user: { select: { id: true, name: true, email: true } },
      testCenter: { select: { id: true, name: true } },
    },
  });
}

export async function deleteCenterStaff(tenantId: string, id: string) {
  const existing = await prisma.centerStaff.findFirst({
    where: { id, testCenter: { tenantId } },
  });
  if (!existing) throw errors.notFound("ไม่พบบุคลากร");

  return prisma.centerStaff.delete({ where: { id } });
}

// ═══════════════════════════════════════════════════════════════════
// StaffShift CRUD
// ═══════════════════════════════════════════════════════════════════

export async function listStaffShifts(tenantId: string, filters: StaffShiftFilter) {
  const { centerStaffId, testCenterId, dateFrom, dateTo, status, page, perPage } = filters;

  const where = {
    centerStaff: {
      testCenter: { tenantId },
      ...(testCenterId && { testCenterId }),
    },
    ...(centerStaffId && { centerStaffId }),
    ...(status && { status }),
    ...(dateFrom || dateTo
      ? {
          date: {
            ...(dateFrom && { gte: dateFrom }),
            ...(dateTo && { lte: dateTo }),
          },
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.staffShift.findMany({
      where,
      include: {
        centerStaff: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            testCenter: { select: { id: true, name: true } },
          },
        },
        examSchedule: { select: { id: true, exam: { select: { title: true } }, startDate: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.staffShift.count({ where }),
  ]);

  return {
    data,
    meta: buildPaginationMeta(page, perPage, total),
  };
}

export async function createStaffShift(tenantId: string, data: CreateStaffShift) {
  // Verify staff belongs to tenant
  const staff = await prisma.centerStaff.findFirst({
    where: { id: data.centerStaffId, testCenter: { tenantId } },
  });
  if (!staff) throw errors.notFound("ไม่พบบุคลากร");

  return prisma.staffShift.create({
    data: {
      ...data,
      userId: staff.userId,
    },
  });
}

export async function updateStaffShift(tenantId: string, id: string, data: UpdateStaffShift) {
  const existing = await prisma.staffShift.findFirst({
    where: { id, centerStaff: { testCenter: { tenantId } } },
  });
  if (!existing) throw errors.notFound("ไม่พบข้อมูลเวร");

  return prisma.staffShift.update({ where: { id }, data });
}

export async function deleteStaffShift(tenantId: string, id: string) {
  const existing = await prisma.staffShift.findFirst({
    where: { id, centerStaff: { testCenter: { tenantId } } },
  });
  if (!existing) throw errors.notFound("ไม่พบข้อมูลเวร");

  return prisma.staffShift.delete({ where: { id } });
}
