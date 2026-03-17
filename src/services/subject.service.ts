import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type { CreateSubjectInput, UpdateSubjectInput } from "@/lib/validations/subject";

// ============================================================
// List Subjects (with counts)
// ============================================================
export async function listSubjects(tenantId: string, categoryId?: string) {
  return prisma.subject.findMany({
    where: {
      tenantId,
      ...(categoryId ? { categoryId } : {}),
    },
    include: {
      category: {
        select: { id: true, name: true },
      },
      _count: {
        select: {
          questions: true,
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

// ============================================================
// Get Subject Detail
// ============================================================
export async function getSubject(tenantId: string, id: string) {
  const subject = await prisma.subject.findFirst({
    where: { id, tenantId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: { questions: true },
      },
    },
  });

  if (!subject) {
    throw errors.notFound("ไม่พบวิชาที่ระบุ");
  }

  return subject;
}

// ============================================================
// Create Subject
// ============================================================
export async function createSubject(
  tenantId: string,
  data: Omit<CreateSubjectInput, "sortOrder"> & { sortOrder?: number }
) {
  // Check unique code within tenant
  const existing = await prisma.subject.findFirst({
    where: { tenantId, code: data.code },
  });
  if (existing) {
    throw errors.conflict(`รหัสวิชา "${data.code}" ถูกใช้แล้ว`);
  }

  // Validate categoryId if provided
  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, tenantId },
    });
    if (!category) {
      throw errors.notFound("ไม่พบหมวดหมู่ที่ระบุ");
    }
  }

  return prisma.subject.create({
    data: {
      tenantId,
      code: data.code,
      name: data.name,
      description: data.description ?? null,
      categoryId: data.categoryId ?? null,
      color: data.color ?? null,
      sortOrder: data.sortOrder ?? 0,
    },
    include: {
      category: { select: { id: true, name: true } },
      _count: { select: { questions: true } },
    },
  });
}

// ============================================================
// Update Subject
// ============================================================
export async function updateSubject(
  tenantId: string,
  id: string,
  data: Partial<UpdateSubjectInput>
) {
  const subject = await prisma.subject.findFirst({
    where: { id, tenantId },
  });
  if (!subject) {
    throw errors.notFound("ไม่พบวิชาที่ระบุ");
  }

  // Check unique code if changed
  if (data.code && data.code !== subject.code) {
    const existing = await prisma.subject.findFirst({
      where: { tenantId, code: data.code },
    });
    if (existing) {
      throw errors.conflict(`รหัสวิชา "${data.code}" ถูกใช้แล้ว`);
    }
  }

  return prisma.subject.update({
    where: { id },
    data: {
      ...(data.code !== undefined && { code: data.code }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      category: { select: { id: true, name: true } },
      _count: { select: { questions: true } },
    },
  });
}

// ============================================================
// Delete Subject (prevent if has questions)
// ============================================================
export async function deleteSubject(tenantId: string, id: string) {
  const subject = await prisma.subject.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { questions: true } } },
  });

  if (!subject) {
    throw errors.notFound("ไม่พบวิชาที่ระบุ");
  }

  if (subject._count.questions > 0) {
    throw errors.validation(
      `ไม่สามารถลบวิชานี้ได้ เนื่องจากมีข้อสอบ ${subject._count.questions} ข้ออยู่ภายใน`
    );
  }

  return prisma.subject.delete({ where: { id } });
}
