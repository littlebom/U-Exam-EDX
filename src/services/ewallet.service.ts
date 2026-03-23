import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { buildPaginationMeta } from "@/types";
import crypto from "crypto";
import type { Prisma } from "@/generated/prisma";

// ─── Get Connection ──────────────────────────────────────────────────

export async function getEwalletConnection(tenantId: string) {
  const conn = await prisma.ewalletConnection.findUnique({
    where: { tenantId },
  });
  return conn;
}

// ─── Save / Update Connection ────────────────────────────────────────

export async function saveEwalletConnection(
  tenantId: string,
  data: {
    apiUrl: string;
    apiKey: string;
    apiSecret: string;
    webhookSecret: string;
    isActive?: boolean;
  }
) {
  return prisma.ewalletConnection.upsert({
    where: { tenantId },
    create: {
      tenantId,
      ...data,
      isActive: data.isActive ?? true,
    },
    update: data,
  });
}

// ─── Toggle Connection ──────────────────────────────────────────────

export async function toggleEwalletConnection(tenantId: string, isActive: boolean) {
  const conn = await prisma.ewalletConnection.findUnique({
    where: { tenantId },
  });
  if (!conn) throw errors.notFound("ไม่พบการเชื่อมต่อ e-Wallet");

  return prisma.ewalletConnection.update({
    where: { tenantId },
    data: { isActive },
  });
}

// ─── HMAC Signature ──────────────────────────────────────────────────

export function generateHmacSignature(
  secret: string,
  timestamp: string,
  body: string
): string {
  return crypto
    .createHmac("sha256", secret)
    .update(timestamp + body)
    .digest("hex");
}

export function verifyHmacSignature(
  secret: string,
  timestamp: string,
  body: string,
  signature: string
): boolean {
  // Check timestamp within 5 minutes
  const ts = parseInt(timestamp, 10);
  const now = Date.now();
  if (Math.abs(now - ts) > 5 * 60 * 1000) return false;

  const expected = generateHmacSignature(secret, timestamp, body);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ─── Create e-Wallet Payment ─────────────────────────────────────────

export async function createEwalletPayment(
  tenantId: string,
  paymentId: string,
  amount: number
) {
  const conn = await prisma.ewalletConnection.findUnique({
    where: { tenantId },
  });
  if (!conn || !conn.isActive) {
    throw errors.validation("e-Wallet ไม่ได้เปิดใช้งาน");
  }

  // Create transaction record
  const transaction = await prisma.ewalletTransaction.create({
    data: {
      paymentId,
      type: "PAYMENT",
      status: "PENDING",
      amount,
    },
  });

  // In production: call external e-Wallet API
  // const timestamp = Date.now().toString();
  // const body = JSON.stringify({ paymentId, amount, transactionId: transaction.id });
  // const signature = generateHmacSignature(conn.apiSecret, timestamp, body);
  // const response = await fetch(`${conn.apiUrl}/api/external/payment/create`, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     "X-API-Key": conn.apiKey,
  //     "X-Timestamp": timestamp,
  //     "X-Signature": signature,
  //   },
  //   body,
  // });

  return transaction;
}

// ─── Process e-Wallet Webhook (payment callback) ─────────────────────

export async function processEwalletWebhook(
  tenantId: string,
  data: {
    transactionId: string;
    externalTransactionId: string;
    status: "COMPLETED" | "FAILED";
    metadata?: Record<string, unknown>;
  }
) {
  const transaction = await prisma.ewalletTransaction.findUnique({
    where: { id: data.transactionId },
    include: { payment: true },
  });

  if (!transaction) throw errors.notFound("ไม่พบรายการ");

  return prisma.$transaction(async (tx) => {
    // Update e-Wallet transaction
    const updated = await tx.ewalletTransaction.update({
      where: { id: data.transactionId },
      data: {
        externalTransactionId: data.externalTransactionId,
        status: data.status,
        metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
        processedAt: new Date(),
      },
    });

    // Update payment status to match
    if (data.status === "COMPLETED") {
      await tx.payment.update({
        where: { id: transaction.paymentId },
        data: {
          status: "COMPLETED",
          transactionId: data.externalTransactionId,
          paidAt: new Date(),
        },
      });
    } else if (data.status === "FAILED") {
      await tx.payment.update({
        where: { id: transaction.paymentId },
        data: {
          status: "FAILED",
          failedAt: new Date(),
        },
      });
    }

    return updated;
  });
}

// ─── Create e-Wallet Refund ──────────────────────────────────────────

export async function createEwalletRefund(
  tenantId: string,
  paymentId: string,
  amount: number
) {
  const conn = await prisma.ewalletConnection.findUnique({
    where: { tenantId },
  });
  if (!conn || !conn.isActive) {
    throw errors.validation("e-Wallet ไม่ได้เปิดใช้งาน");
  }

  return prisma.ewalletTransaction.create({
    data: {
      paymentId,
      type: "REFUND",
      status: "PENDING",
      amount,
    },
  });
}

// ─── List Transactions ───────────────────────────────────────────────

export async function listEwalletTransactions(
  paymentId: string,
  filters: { page?: number; perPage?: number } = {}
) {
  const { page = 1, perPage = 20 } = filters;

  const where = { paymentId };

  const [total, transactions] = await Promise.all([
    prisma.ewalletTransaction.count({ where }),
    prisma.ewalletTransaction.findMany({
      where,
      include: {
        payment: {
          select: { id: true, amount: true, status: true, method: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    data: transactions,
    meta: buildPaginationMeta(page, perPage, total),
  };
}

// ─── Send Results to e-Wallet ────────────────────────────────────────

export async function sendResultsToEwallet(
  tenantId: string,
  studentId: string,
  resultData: {
    examTitle: string;
    score: number;
    maxScore: number;
    isPassed: boolean;
    gradedAt: Date;
  }
) {
  const conn = await prisma.ewalletConnection.findUnique({
    where: { tenantId },
  });
  if (!conn || !conn.isActive) return null;

  // In production: call external e-Wallet API
  // const timestamp = Date.now().toString();
  // const body = JSON.stringify({ studentId, ...resultData });
  // const signature = generateHmacSignature(conn.apiSecret, timestamp, body);
  // await fetch(`${conn.apiUrl}/api/external/results`, { ... });

  return { sent: true, studentId };
}

// ─── Send Credentials to e-Wallet ───────────────────────────────────

export async function sendCredentialToEwallet(
  tenantId: string,
  studentId: string,
  credentialData: {
    certificateNumber: string;
    examTitle: string;
    issuedAt: Date;
    expiresAt?: Date;
    verificationUrl: string;
  }
) {
  const conn = await prisma.ewalletConnection.findUnique({
    where: { tenantId },
  });
  if (!conn || !conn.isActive) return null;

  // In production: call external e-Wallet API
  // const timestamp = Date.now().toString();
  // const body = JSON.stringify({ studentId, ...credentialData });
  // const signature = generateHmacSignature(conn.apiSecret, timestamp, body);
  // await fetch(`${conn.apiUrl}/api/external/credentials`, { ... });

  return { sent: true, studentId };
}
