import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type {
  CreatePaymentInput,
  PaymentFilter,
  ProcessPaymentInput,
} from "@/lib/validations/payment";

// ─── List Payments ──────────────────────────────────────────────────

export async function listPayments(tenantId: string, filters: PaymentFilter) {
  const { status, method, candidateId, search, page, perPage } = filters;

  const where: Record<string, unknown> = { tenantId };

  if (status) where.status = status;
  if (method) where.method = method;
  if (candidateId) where.candidateId = candidateId;

  if (search) {
    where.OR = [
      { transactionId: { contains: search, mode: "insensitive" } },
      { candidate: { name: { contains: search, mode: "insensitive" } } },
      { candidate: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        registration: {
          select: {
            id: true,
            examSchedule: {
              select: {
                id: true,
                startDate: true,
                exam: { select: { id: true, title: true } },
              },
            },
          },
        },
        invoice: { select: { id: true, invoiceNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    data: payments,
    meta: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

// ─── Get Payment by ID ──────────────────────────────────────────────

export async function getPayment(tenantId: string, id: string) {
  const payment = await prisma.payment.findFirst({
    where: { id, tenantId },
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      registration: {
        select: {
          id: true,
          status: true,
          seatNumber: true,
          examSchedule: {
            select: {
              id: true,
              startDate: true,
              exam: { select: { id: true, title: true } },
            },
          },
          testCenter: { select: { id: true, name: true } },
        },
      },
      invoice: true,
      refunds: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!payment) throw errors.notFound("ไม่พบรายการชำระเงิน");
  return payment;
}

// ─── Create Payment ─────────────────────────────────────────────────

export async function createPayment(
  tenantId: string,
  data: CreatePaymentInput
) {
  // Verify registration exists and belongs to tenant
  const registration = await prisma.registration.findFirst({
    where: { id: data.registrationId, tenantId },
    include: {
      candidate: { select: { id: true, name: true } },
      examSchedule: {
        select: { exam: { select: { title: true } } },
      },
    },
  });

  if (!registration) throw errors.notFound("ไม่พบการสมัครสอบ");

  // Check for existing pending/completed payments
  const existingPayment = await prisma.payment.findFirst({
    where: {
      registrationId: data.registrationId,
      status: { in: ["PENDING", "COMPLETED"] },
    },
  });

  if (existingPayment) {
    throw errors.conflict("มีรายการชำระเงินสำหรับการสมัครนี้อยู่แล้ว");
  }

  return prisma.payment.create({
    data: {
      tenantId,
      registrationId: data.registrationId,
      candidateId: registration.candidateId,
      amount: data.amount,
      method: data.method,
      description:
        data.description ??
        `ค่าสมัครสอบ ${registration.examSchedule.exam.title} — ${registration.candidate.name}`,
    },
    include: {
      candidate: { select: { id: true, name: true, email: true } },
    },
  });
}

// ─── Process Payment (mark as paid) ─────────────────────────────────

export async function processPayment(
  tenantId: string,
  id: string,
  data: ProcessPaymentInput
) {
  const payment = await prisma.payment.findFirst({
    where: { id, tenantId },
  });

  if (!payment) throw errors.notFound("ไม่พบรายการชำระเงิน");
  if (payment.status !== "PENDING") {
    throw errors.validation("สามารถยืนยันได้เฉพาะรายการที่รอชำระเท่านั้น");
  }

  // Use transaction: mark payment as COMPLETED + update registration paymentStatus
  return prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id },
      data: {
        status: "COMPLETED",
        transactionId: data.transactionId,
        gatewayRef: data.gatewayRef,
        paidAt: new Date(),
      },
    });

    // Update registration payment status
    await tx.registration.update({
      where: { id: payment.registrationId },
      data: { paymentStatus: "PAID" },
    });

    // Auto-generate invoice
    const invoiceCount = await tx.invoice.count({ where: { tenantId } });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, "0")}`;

    await tx.invoice.create({
      data: {
        tenantId,
        paymentId: id,
        invoiceNumber,
        items: [
          {
            description: updatedPayment.description ?? "ค่าสมัครสอบ",
            quantity: 1,
            unitPrice: updatedPayment.amount,
            amount: updatedPayment.amount,
          },
        ],
        subtotal: updatedPayment.amount,
        taxRate: 0,
        taxAmount: 0,
        total: updatedPayment.amount,
      },
    });

    return updatedPayment;
  });
}

// ─── Payment Stats ──────────────────────────────────────────────────

export async function getPaymentStats(tenantId: string) {
  const [total, completed, pending, refunded, failed] = await Promise.all([
    prisma.payment.count({ where: { tenantId } }),
    prisma.payment.count({ where: { tenantId, status: "COMPLETED" } }),
    prisma.payment.count({ where: { tenantId, status: "PENDING" } }),
    prisma.payment.count({ where: { tenantId, status: "REFUNDED" } }),
    prisma.payment.count({ where: { tenantId, status: "FAILED" } }),
  ]);

  const revenueResult = await prisma.payment.aggregate({
    where: { tenantId, status: "COMPLETED" },
    _sum: { amount: true },
  });

  return {
    total,
    completed,
    pending,
    refunded,
    failed,
    totalRevenue: revenueResult._sum.amount ?? 0,
  };
}
