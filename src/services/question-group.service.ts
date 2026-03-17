import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type { CreateQuestionGroupInput } from "@/lib/validations/question-group";

// ---------------------------------------------------------------------------
// 1. listQuestionGroups — List groups for a subject
// ---------------------------------------------------------------------------

export async function listQuestionGroups(
  tenantId: string,
  subjectId: string
) {
  // Verify subject belongs to tenant
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, tenantId },
    select: { id: true },
  });
  if (!subject) {
    throw errors.notFound("ไม่พบวิชาที่ระบุ");
  }

  return prisma.questionGroup.findMany({
    where: { tenantId, subjectId },
    include: {
      _count: {
        select: { questions: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

// ---------------------------------------------------------------------------
// 2. getQuestionGroup — Get single group
// ---------------------------------------------------------------------------

export async function getQuestionGroup(tenantId: string, id: string) {
  const group = await prisma.questionGroup.findFirst({
    where: { id, tenantId },
    include: {
      subject: { select: { id: true, code: true, name: true } },
      _count: { select: { questions: true } },
    },
  });

  if (!group) {
    throw errors.notFound("ไม่พบกลุ่มข้อสอบ");
  }

  return group;
}

// ---------------------------------------------------------------------------
// 3. createQuestionGroup
// ---------------------------------------------------------------------------

export async function createQuestionGroup(
  tenantId: string,
  data: CreateQuestionGroupInput
) {
  // Verify subject belongs to tenant
  const subject = await prisma.subject.findFirst({
    where: { id: data.subjectId, tenantId },
  });
  if (!subject) {
    throw errors.notFound("ไม่พบวิชาที่ระบุ");
  }

  // Check unique name within subject
  const existing = await prisma.questionGroup.findFirst({
    where: { subjectId: data.subjectId, name: data.name, tenantId },
  });
  if (existing) {
    throw errors.conflict(`ชื่อกลุ่ม "${data.name}" ถูกใช้แล้วในวิชานี้`);
  }

  return prisma.questionGroup.create({
    data: {
      tenantId,
      subjectId: data.subjectId,
      name: data.name,
      description: data.description ?? null,
      color: data.color ?? null,
      sortOrder: data.sortOrder ?? 0,
    },
    include: {
      _count: { select: { questions: true } },
    },
  });
}

// ---------------------------------------------------------------------------
// 4. updateQuestionGroup
// ---------------------------------------------------------------------------

export async function updateQuestionGroup(
  tenantId: string,
  id: string,
  data: { name?: string; description?: string | null; color?: string | null; sortOrder?: number }
) {
  const group = await prisma.questionGroup.findFirst({
    where: { id, tenantId },
  });
  if (!group) {
    throw errors.notFound("ไม่พบกลุ่มข้อสอบ");
  }

  // Check unique name if changed
  if (data.name && data.name !== group.name) {
    const existing = await prisma.questionGroup.findFirst({
      where: { subjectId: group.subjectId, name: data.name, tenantId },
    });
    if (existing) {
      throw errors.conflict(`ชื่อกลุ่ม "${data.name}" ถูกใช้แล้วในวิชานี้`);
    }
  }

  return prisma.questionGroup.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
    include: {
      _count: { select: { questions: true } },
    },
  });
}

// ---------------------------------------------------------------------------
// 5. deleteQuestionGroup — Nullify questions, then delete
// ---------------------------------------------------------------------------

export async function deleteQuestionGroup(tenantId: string, id: string) {
  const group = await prisma.questionGroup.findFirst({
    where: { id, tenantId },
  });

  if (!group) {
    throw errors.notFound("ไม่พบกลุ่มข้อสอบ");
  }

  // Nullify questionGroupId on affected questions, then delete the group
  await prisma.$transaction([
    prisma.question.updateMany({
      where: { questionGroupId: id },
      data: { questionGroupId: null },
    }),
    prisma.questionGroup.delete({ where: { id } }),
  ]);
}
