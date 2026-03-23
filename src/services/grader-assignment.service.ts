import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { buildPaginationMeta } from "@/types";
import type { PaginationMeta } from "@/types";
import type { Prisma } from "@/generated/prisma";

// ─── Types ──────────────────────────────────────────────────────────

interface GraderAssignmentFilter {
  examId?: string;
  userId?: string;
  isActive?: boolean;
  page?: number;
  perPage?: number;
}

interface CreateGraderAssignmentInput {
  examId: string;
  userId: string;
  scope?: string;
  sectionId?: string;
}

interface UpdateGraderAssignmentInput {
  scope?: string;
  sectionId?: string | null;
  isActive?: boolean;
}

// ─── Shared Includes ────────────────────────────────────────────────

const assignmentInclude = {
  exam: { select: { id: true, title: true } },
  user: { select: { id: true, name: true, email: true } },
  section: { select: { id: true, title: true } },
} satisfies Prisma.GraderAssignmentInclude;

// ─── List Assignments ───────────────────────────────────────────────

export async function listGraderAssignments(
  tenantId: string,
  filters: GraderAssignmentFilter
): Promise<{ data: unknown[]; meta: PaginationMeta }> {
  const { examId, userId, isActive, page = 1, perPage = 50 } = filters;

  const where: Prisma.GraderAssignmentWhereInput = {
    tenantId,
    ...(examId && { examId }),
    ...(userId && { userId }),
    ...(isActive !== undefined && { isActive }),
  };

  const [data, total] = await Promise.all([
    prisma.graderAssignment.findMany({
      where,
      include: assignmentInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.graderAssignment.count({ where }),
  ]);

  return {
    data,
    meta: buildPaginationMeta(page, perPage, total),
  };
}

// ─── Create Assignment ──────────────────────────────────────────────

export async function createGraderAssignment(
  tenantId: string,
  input: CreateGraderAssignmentInput
) {
  // Verify exam belongs to tenant
  const exam = await prisma.exam.findUnique({
    where: { id: input.examId },
    select: { tenantId: true },
  });
  if (!exam) throw errors.notFound("ไม่พบชุดสอบ");
  if (exam.tenantId !== tenantId) throw errors.forbidden();

  // Check duplicate
  const existing = await prisma.graderAssignment.findFirst({
    where: {
      examId: input.examId,
      userId: input.userId,
      sectionId: input.sectionId ?? null,
    },
  });
  if (existing) throw errors.conflict("ผู้ตรวจนี้ถูกมอบหมายไว้แล้ว");

  return prisma.graderAssignment.create({
    data: {
      tenantId,
      examId: input.examId,
      userId: input.userId,
      scope: input.scope ?? "ALL",
      sectionId: input.sectionId,
    },
    include: assignmentInclude,
  });
}

// ─── Update Assignment ──────────────────────────────────────────────

export async function updateGraderAssignment(
  tenantId: string,
  assignmentId: string,
  input: UpdateGraderAssignmentInput
) {
  const assignment = await prisma.graderAssignment.findUnique({
    where: { id: assignmentId },
  });
  if (!assignment) throw errors.notFound("ไม่พบการมอบหมาย");
  if (assignment.tenantId !== tenantId) throw errors.forbidden();

  return prisma.graderAssignment.update({
    where: { id: assignmentId },
    data: {
      ...(input.scope !== undefined && { scope: input.scope }),
      ...(input.sectionId !== undefined && {
        sectionId: input.sectionId,
      }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
    include: assignmentInclude,
  });
}

// ─── Delete Assignment ──────────────────────────────────────────────

export async function deleteGraderAssignment(
  tenantId: string,
  assignmentId: string
) {
  const assignment = await prisma.graderAssignment.findUnique({
    where: { id: assignmentId },
  });
  if (!assignment) throw errors.notFound("ไม่พบการมอบหมาย");
  if (assignment.tenantId !== tenantId) throw errors.forbidden();

  await prisma.graderAssignment.delete({
    where: { id: assignmentId },
  });
}

// ─── Get Assigned Exams for Grader ──────────────────────────────────

export async function getAssignedExams(tenantId: string, userId: string) {
  return prisma.graderAssignment.findMany({
    where: { tenantId, userId, isActive: true },
    include: assignmentInclude,
    orderBy: { createdAt: "desc" },
  });
}
