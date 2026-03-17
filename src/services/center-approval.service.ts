import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";

// ─── List Approvals ─────────────────────────────────────────────────

export async function listApprovals(
  tenantId: string,
  filters: {
    status?: string;
    testCenterId?: string;
    type?: string;
    page?: number;
    perPage?: number;
  } = {}
) {
  const { status, testCenterId, type, page = 1, perPage = 20 } = filters;

  const where: Record<string, unknown> = { tenantId };
  if (status) where.status = status;
  if (testCenterId) where.testCenterId = testCenterId;
  if (type) where.type = type;

  const [total, approvals] = await Promise.all([
    prisma.centerApproval.count({ where }),
    prisma.centerApproval.findMany({
      where,
      include: {
        testCenter: { select: { id: true, name: true, code: true, province: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    data: approvals,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  };
}

// ─── Get Approval Detail ────────────────────────────────────────────

export async function getApproval(tenantId: string, id: string) {
  const approval = await prisma.centerApproval.findFirst({
    where: { id, tenantId },
    include: {
      testCenter: {
        select: {
          id: true,
          name: true,
          code: true,
          address: true,
          district: true,
          province: true,
          phone: true,
          email: true,
          facilities: true,
          status: true,
        },
      },
      reviewedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!approval) throw errors.notFound("ไม่พบคำขออนุมัติ");
  return approval;
}

// ─── Submit for Approval ────────────────────────────────────────────

export async function submitForApproval(
  tenantId: string,
  data: {
    testCenterId: string;
    type: "INITIAL" | "RENEWAL";
    documents?: Array<{ name: string; url: string; type: string }>;
  }
) {
  // Verify test center exists and belongs to tenant
  const center = await prisma.testCenter.findFirst({
    where: { id: data.testCenterId, tenantId },
  });
  if (!center) throw errors.notFound("ไม่พบศูนย์สอบ");

  // Check for existing pending approval
  const existing = await prisma.centerApproval.findFirst({
    where: {
      testCenterId: data.testCenterId,
      status: { in: ["PENDING", "IN_REVIEW"] },
    },
  });
  if (existing) {
    throw errors.conflict("มีคำขออนุมัติที่ยังดำเนินการอยู่แล้ว");
  }

  return prisma.centerApproval.create({
    data: {
      tenantId,
      testCenterId: data.testCenterId,
      type: data.type,
      status: "PENDING",
      documents: data.documents ?? undefined,
    },
    include: {
      testCenter: { select: { id: true, name: true } },
    },
  });
}

// ─── Start Review ───────────────────────────────────────────────────

export async function startReview(
  tenantId: string,
  id: string,
  reviewerId: string
) {
  const approval = await prisma.centerApproval.findFirst({
    where: { id, tenantId },
  });
  if (!approval) throw errors.notFound("ไม่พบคำขออนุมัติ");
  if (approval.status !== "PENDING") {
    throw errors.validation("สามารถเริ่มตรวจสอบได้เฉพาะคำขอที่รอดำเนินการ");
  }

  return prisma.centerApproval.update({
    where: { id },
    data: {
      status: "IN_REVIEW",
      reviewedById: reviewerId,
    },
  });
}

// ─── Approve ────────────────────────────────────────────────────────

export async function approveCenter(
  tenantId: string,
  id: string,
  reviewerId: string,
  data: {
    comments?: string;
    checklist?: Array<{ item: string; passed: boolean; notes?: string }>;
    expiresAt?: Date;
  }
) {
  const approval = await prisma.centerApproval.findFirst({
    where: { id, tenantId },
  });
  if (!approval) throw errors.notFound("ไม่พบคำขออนุมัติ");
  if (!["PENDING", "IN_REVIEW"].includes(approval.status)) {
    throw errors.validation("ไม่สามารถอนุมัติคำขอนี้ได้");
  }

  // Default expires 2 years from now
  const expiresAt = data.expiresAt ?? new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.centerApproval.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedById: reviewerId,
        comments: data.comments,
        checklist: data.checklist ?? undefined,
        expiresAt,
        reviewedAt: new Date(),
      },
    });

    // Update test center status to ACTIVE
    await tx.testCenter.update({
      where: { id: approval.testCenterId },
      data: { status: "ACTIVE" },
    });

    return updated;
  });
}

// ─── Reject ─────────────────────────────────────────────────────────

export async function rejectCenter(
  tenantId: string,
  id: string,
  reviewerId: string,
  data: {
    comments: string;
    checklist?: Array<{ item: string; passed: boolean; notes?: string }>;
  }
) {
  const approval = await prisma.centerApproval.findFirst({
    where: { id, tenantId },
  });
  if (!approval) throw errors.notFound("ไม่พบคำขออนุมัติ");
  if (!["PENDING", "IN_REVIEW"].includes(approval.status)) {
    throw errors.validation("ไม่สามารถปฏิเสธคำขอนี้ได้");
  }

  return prisma.centerApproval.update({
    where: { id },
    data: {
      status: "REJECTED",
      reviewedById: reviewerId,
      comments: data.comments,
      checklist: data.checklist ?? undefined,
      reviewedAt: new Date(),
    },
  });
}

// ─── Get Approval History for a Center ──────────────────────────────

export async function getCenterApprovalHistory(
  tenantId: string,
  testCenterId: string
) {
  return prisma.centerApproval.findMany({
    where: { tenantId, testCenterId },
    include: {
      reviewedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
