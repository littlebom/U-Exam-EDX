import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type { CreateRefundInput } from "@/lib/validations/payment";

// ─── List Refunds ───────────────────────────────────────────────────

export async function listRefunds(
  tenantId: string,
  filters: { status?: string; page: number; perPage: number }
) {
  const { status, page, perPage } = filters;

  const where: Record<string, unknown> = { tenantId };
  if (status) where.status = status;

  const [total, refunds] = await Promise.all([
    prisma.refund.count({ where }),
    prisma.refund.findMany({
      where,
      include: {
        payment: {
          select: {
            id: true,
            amount: true,
            method: true,
            candidate: { select: { id: true, name: true, email: true } },
            registration: {
              select: {
                examSchedule: {
                  select: {
                    exam: { select: { id: true, title: true } },
                  },
                },
              },
            },
          },
        },
        processedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    data: refunds,
    meta: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

// ─── Create Refund Request ──────────────────────────────────────────

export async function createRefund(
  tenantId: string,
  data: CreateRefundInput
) {
  const payment = await prisma.payment.findFirst({
    where: { id: data.paymentId, tenantId },
    include: { refunds: true },
  });

  if (!payment) throw errors.notFound("ไม่พบรายการชำระเงิน");
  if (payment.status !== "COMPLETED") {
    throw errors.validation("สามารถคืนเงินได้เฉพาะรายการที่ชำระแล้วเท่านั้น");
  }

  // Check total refund amount doesn't exceed payment
  const existingRefundTotal = payment.refunds
    .filter((r) => r.status !== "REJECTED")
    .reduce((sum, r) => sum + r.amount, 0);

  if (existingRefundTotal + data.amount > payment.amount) {
    throw errors.validation(
      `ยอดคืนเงินรวมเกินจำนวนที่ชำระ (ชำระ: ${payment.amount}, คืนแล้ว: ${existingRefundTotal})`
    );
  }

  return prisma.refund.create({
    data: {
      tenantId,
      paymentId: data.paymentId,
      amount: data.amount,
      reason: data.reason,
    },
  });
}

// ─── Process Refund (approve/reject) ────────────────────────────────

export async function processRefund(
  tenantId: string,
  refundId: string,
  status: "APPROVED" | "REJECTED",
  processedById: string
) {
  const refund = await prisma.refund.findFirst({
    where: { id: refundId, tenantId },
  });

  if (!refund) throw errors.notFound("ไม่พบรายการคืนเงิน");
  if (refund.status !== "PENDING") {
    throw errors.validation("สามารถดำเนินการได้เฉพาะรายการที่รอดำเนินการเท่านั้น");
  }

  if (status === "APPROVED") {
    // Transaction: approve refund + update payment status + update registration
    return prisma.$transaction(async (tx) => {
      const updatedRefund = await tx.refund.update({
        where: { id: refundId },
        data: {
          status: "PROCESSED",
          processedById,
          processedAt: new Date(),
        },
      });

      // Check if this is a full refund
      const payment = await tx.payment.findUniqueOrThrow({
        where: { id: refund.paymentId },
        include: { refunds: { where: { status: "PROCESSED" } } },
      });

      const totalRefunded =
        payment.refunds.reduce((sum, r) => sum + r.amount, 0) + refund.amount;

      if (totalRefunded >= payment.amount) {
        // Full refund — mark payment as REFUNDED
        await tx.payment.update({
          where: { id: refund.paymentId },
          data: { status: "REFUNDED" },
        });

        // Update registration payment status
        await tx.registration.update({
          where: { id: payment.registrationId },
          data: { paymentStatus: "REFUNDED" },
        });
      }

      return updatedRefund;
    });
  }

  // Rejected
  return prisma.refund.update({
    where: { id: refundId },
    data: {
      status: "REJECTED",
      processedById,
      processedAt: new Date(),
    },
  });
}
