import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type { PaginationMeta } from "@/types";
import type { Prisma } from "@/generated/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScheduleFilters {
  examId?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

interface ScheduleListResult {
  data: Array<Record<string, unknown>>;
  meta: PaginationMeta;
}

interface CreateScheduleData {
  examId: string;
  startDate: Date;
  endDate: Date;
  registrationOpenDate?: Date | null;
  registrationDeadline?: Date | null;
  maxCandidates?: number | null;
  location?: string | null;
  testCenterId?: string | null;
  roomId?: string | null;
  registrationFee?: number;
  settings?: Record<string, unknown> | null;
}

interface UpdateScheduleData {
  startDate?: Date;
  endDate?: Date;
  registrationOpenDate?: Date | null;
  registrationDeadline?: Date | null;
  maxCandidates?: number | null;
  status?: string;
  location?: string | null;
  testCenterId?: string | null;
  roomId?: string | null;
  registrationFee?: number;
  settings?: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Shared include for returning schedule with relations
// ---------------------------------------------------------------------------

const scheduleWithExam = {
  exam: { select: { id: true, title: true, status: true, duration: true } },
  testCenter: { select: { id: true, name: true, code: true } },
  room: { select: { id: true, name: true, code: true, capacity: true } },
} satisfies Prisma.ExamScheduleInclude;

// ---------------------------------------------------------------------------
// 1. listSchedules — Paginated list with filters
// ---------------------------------------------------------------------------

export async function listSchedules(
  tenantId: string,
  filters: ScheduleFilters = {}
): Promise<ScheduleListResult> {
  const page = filters.page ?? 1;
  const perPage = filters.perPage ?? 20;
  const skip = (page - 1) * perPage;

  const where: Prisma.ExamScheduleWhereInput = {
    tenantId,
    ...(filters.examId ? { examId: filters.examId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.examSchedule.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { startDate: "asc" },
      include: {
        exam: { select: { id: true, title: true, status: true } },
        testCenter: { select: { id: true, name: true, code: true } },
        room: { select: { id: true, name: true, code: true, capacity: true } },
        // TODO: include _count of registrations when Registration module is implemented
        // _count: { select: { registrations: true } },
      },
    }),
    prisma.examSchedule.count({ where }),
  ]);

  return {
    data: data as unknown as Array<Record<string, unknown>>,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

// ---------------------------------------------------------------------------
// 2. getSchedule — Get single schedule with exam details
// ---------------------------------------------------------------------------

export async function getSchedule(tenantId: string, scheduleId: string) {
  const schedule = await prisma.examSchedule.findFirst({
    where: { id: scheduleId, tenantId },
    include: scheduleWithExam,
  });

  if (!schedule) {
    throw errors.notFound("ไม่พบตารางสอบ");
  }

  return schedule;
}

// ---------------------------------------------------------------------------
// 3. createSchedule — Create schedule with exam ownership + conflict check
// ---------------------------------------------------------------------------

export async function createSchedule(
  tenantId: string,
  data: CreateScheduleData
) {
  // Verify the exam belongs to the tenant and is PUBLISHED or ACTIVE
  const exam = await prisma.exam.findFirst({
    where: { id: data.examId, tenantId },
    select: { id: true, status: true },
  });

  if (!exam) {
    throw errors.notFound("ไม่พบข้อสอบ");
  }

  if (exam.status !== "PUBLISHED" && exam.status !== "ACTIVE") {
    throw errors.validation(
      "สามารถสร้างตารางสอบได้เฉพาะข้อสอบที่มีสถานะ PUBLISHED หรือ ACTIVE เท่านั้น"
    );
  }

  // Check for overlapping schedules for the same exam
  const hasConflict = await checkConflict(
    data.examId,
    data.startDate,
    data.endDate
  );

  if (hasConflict) {
    throw errors.conflict(
      "มีตารางสอบที่ทับซ้อนกันสำหรับข้อสอบนี้"
    );
  }

  const schedule = await prisma.examSchedule.create({
    data: {
      tenantId,
      examId: data.examId,
      startDate: data.startDate,
      endDate: data.endDate,
      registrationOpenDate: data.registrationOpenDate ?? null,
      registrationDeadline: data.registrationDeadline ?? null,
      maxCandidates: data.maxCandidates ?? null,
      location: data.location ?? null,
      testCenterId: data.testCenterId ?? null,
      roomId: data.roomId ?? null,
      registrationFee: data.registrationFee ?? 0,
      settings: data.settings ? (data.settings as Prisma.InputJsonValue) : undefined,
    },
  });

  return getSchedule(tenantId, schedule.id);
}

// ---------------------------------------------------------------------------
// 4. updateSchedule — Update schedule with ownership + status check
// ---------------------------------------------------------------------------

export async function updateSchedule(
  tenantId: string,
  scheduleId: string,
  data: UpdateScheduleData
) {
  const existing = await prisma.examSchedule.findFirst({
    where: { id: scheduleId, tenantId },
  });

  if (!existing) {
    throw errors.notFound("ไม่พบตารางสอบ");
  }

  // COMPLETED/CANCELLED: allow updating only settings (e.g. certificate template)
  if (existing.status === "COMPLETED" || existing.status === "CANCELLED") {
    if (data.settings !== undefined) {
      await prisma.examSchedule.update({
        where: { id: scheduleId },
        data: { settings: data.settings as Prisma.InputJsonValue },
      });
      return getSchedule(tenantId, scheduleId);
    }
    throw errors.validation(
      "ไม่สามารถแก้ไขตารางสอบที่มีสถานะ COMPLETED หรือ CANCELLED ได้"
    );
  }

  // If dates are being changed, check for conflicts
  const newStartDate = data.startDate ?? existing.startDate;
  const newEndDate = data.endDate ?? existing.endDate;

  if (data.startDate !== undefined || data.endDate !== undefined) {
    const hasConflict = await checkConflict(
      existing.examId,
      newStartDate,
      newEndDate,
      scheduleId
    );

    if (hasConflict) {
      throw errors.conflict(
        "มีตารางสอบที่ทับซ้อนกันสำหรับข้อสอบนี้"
      );
    }
  }

  // Build the update payload, only including provided fields
  const updatePayload: Prisma.ExamScheduleUpdateInput = {};
  if (data.startDate !== undefined) updatePayload.startDate = data.startDate;
  if (data.endDate !== undefined) updatePayload.endDate = data.endDate;
  if (data.registrationOpenDate !== undefined) {
    updatePayload.registrationOpenDate = data.registrationOpenDate;
  }
  if (data.registrationDeadline !== undefined) {
    updatePayload.registrationDeadline = data.registrationDeadline;
  }
  if (data.maxCandidates !== undefined) {
    updatePayload.maxCandidates = data.maxCandidates;
  }
  if (data.status !== undefined) updatePayload.status = data.status;
  if (data.location !== undefined) updatePayload.location = data.location;
  if (data.testCenterId !== undefined) {
    updatePayload.testCenter = data.testCenterId
      ? { connect: { id: data.testCenterId } }
      : { disconnect: true };
  }
  if (data.roomId !== undefined) {
    updatePayload.room = data.roomId
      ? { connect: { id: data.roomId } }
      : { disconnect: true };
  }
  if (data.registrationFee !== undefined) {
    updatePayload.registrationFee = data.registrationFee;
  }
  if (data.settings !== undefined) {
    updatePayload.settings = data.settings as Prisma.InputJsonValue;
  }

  await prisma.examSchedule.update({
    where: { id: scheduleId },
    data: updatePayload,
  });

  return getSchedule(tenantId, scheduleId);
}

// ---------------------------------------------------------------------------
// 5. deleteSchedule — Delete schedule (only SCHEDULED status)
// ---------------------------------------------------------------------------

export async function deleteSchedule(tenantId: string, scheduleId: string) {
  const existing = await prisma.examSchedule.findFirst({
    where: { id: scheduleId, tenantId },
  });

  if (!existing) {
    throw errors.notFound("ไม่พบตารางสอบ");
  }

  if (existing.status !== "SCHEDULED") {
    throw errors.validation(
      "สามารถลบตารางสอบได้เฉพาะสถานะ SCHEDULED เท่านั้น"
    );
  }

  await prisma.examSchedule.delete({
    where: { id: scheduleId },
  });
}

// ---------------------------------------------------------------------------
// 6. cancelSchedule — Cancel a schedule (SCHEDULED or ACTIVE only)
// ---------------------------------------------------------------------------

export async function cancelSchedule(tenantId: string, scheduleId: string) {
  const existing = await prisma.examSchedule.findFirst({
    where: { id: scheduleId, tenantId },
  });

  if (!existing) {
    throw errors.notFound("ไม่พบตารางสอบ");
  }

  if (existing.status !== "SCHEDULED" && existing.status !== "ACTIVE") {
    throw errors.validation(
      "สามารถยกเลิกตารางสอบได้เฉพาะสถานะ SCHEDULED หรือ ACTIVE เท่านั้น"
    );
  }

  await prisma.examSchedule.update({
    where: { id: scheduleId },
    data: { status: "CANCELLED" },
  });

  return getSchedule(tenantId, scheduleId);
}

// ---------------------------------------------------------------------------
// 7. checkConflict — Check overlapping schedules for the same exam
// ---------------------------------------------------------------------------

export async function checkConflict(
  examId: string,
  startDate: Date,
  endDate: Date,
  excludeId?: string
): Promise<boolean> {
  const where: Prisma.ExamScheduleWhereInput = {
    examId,
    status: { notIn: ["CANCELLED"] },
    // Overlapping condition: existing.start < newEnd AND existing.end > newStart
    startDate: { lt: endDate },
    endDate: { gt: startDate },
    ...(excludeId ? { id: { not: excludeId } } : {}),
  };

  const count = await prisma.examSchedule.count({ where });

  return count > 0;
}
