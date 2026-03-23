import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { errors } from "@/lib/errors";
import { buildPaginationMeta } from "@/types";
import { sendNotification } from "@/services/notification.service";
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
    meta: buildPaginationMeta(page, perPage, total),
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
    // If payment has a Stripe transaction ID, create Stripe refund first
    const payment = await prisma.payment.findUniqueOrThrow({
      where: { id: refund.paymentId },
    });

    let stripeRefundId: string | undefined;
    if (stripe && payment.transactionId) {
      try {
        const stripeRefund = await stripe.refunds.create({
          payment_intent: payment.transactionId,
          // THB is a zero-decimal currency in Stripe — no * 100
          amount: Math.round(refund.amount),
        });
        stripeRefundId = stripeRefund.id;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        throw errors.badRequest(`Stripe refund failed: ${message}`);
      }
    }

    // Transaction: approve refund + update payment status + update registration
    return prisma.$transaction(async (tx) => {
      const updatedRefund = await tx.refund.update({
        where: { id: refundId },
        data: {
          status: "PROCESSED",
          processedById,
          processedAt: new Date(),
          ...(stripeRefundId && {
            reason: `${refund.reason ?? ""}\n[Stripe Refund: ${stripeRefundId}]`.trim(),
          }),
        },
      });

      // Check if this is a full refund
      const paymentWithRefunds = await tx.payment.findUniqueOrThrow({
        where: { id: refund.paymentId },
        include: { refunds: { where: { status: "PROCESSED" } } },
      });

      const totalRefunded =
        paymentWithRefunds.refunds.reduce((sum, r) => sum + r.amount, 0) + refund.amount;

      if (totalRefunded >= paymentWithRefunds.amount) {
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

      // Send notification to candidate
      try {
        const paymentInfo = await tx.payment.findUniqueOrThrow({
          where: { id: refund.paymentId },
          include: {
            registration: {
              select: {
                examSchedule: {
                  select: { exam: { select: { title: true } } },
                },
              },
            },
          },
        });

        await sendNotification({
          tenantId,
          userId: payment.candidateId,
          type: "REFUND_APPROVED",
          title: "อนุมัติคืนเงินแล้ว",
          message: `คำขอคืนเงิน ${refund.amount} บาท สำหรับ "${paymentInfo.registration.examSchedule.exam.title}" ได้รับการอนุมัติแล้ว`,
          link: "/profile/wallet",
        });
      } catch {
        // Non-critical
      }

      return updatedRefund;
    });
  }

  // Rejected
  const rejectedRefund = await prisma.refund.update({
    where: { id: refundId },
    data: {
      status: "REJECTED",
      processedById,
      processedAt: new Date(),
    },
  });

  // Send rejection notification
  try {
    const payment = await prisma.payment.findUniqueOrThrow({
      where: { id: refund.paymentId },
      include: {
        registration: {
          select: {
            examSchedule: {
              select: { exam: { select: { title: true } } },
            },
          },
        },
      },
    });

    await sendNotification({
      tenantId,
      userId: payment.candidateId,
      type: "REFUND_REJECTED",
      title: "คำขอคืนเงินถูกปฏิเสธ",
      message: `คำขอคืนเงิน ${refund.amount} บาท สำหรับ "${payment.registration.examSchedule.exam.title}" ถูกปฏิเสธ`,
      link: "/profile/wallet",
    });
  } catch {
    // Non-critical
  }

  return rejectedRefund;
}
