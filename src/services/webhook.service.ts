import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import crypto from "crypto";
import type { Prisma } from "@/generated/prisma";

// ─── List Webhooks ──────────────────────────────────────────────────

export async function listWebhooks(tenantId: string) {
  return prisma.webhook.findMany({
    where: { tenantId },
    select: {
      id: true,
      url: true,
      events: true,
      isActive: true,
      lastTriggeredAt: true,
      createdAt: true,
      _count: { select: { logs: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Create Webhook ─────────────────────────────────────────────────

export async function createWebhook(
  tenantId: string,
  data: {
    url: string;
    events: string[];
  }
) {
  const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

  return prisma.webhook.create({
    data: {
      tenantId,
      url: data.url,
      events: data.events as unknown as Prisma.InputJsonValue,
      secret,
    },
  });
}

// ─── Update Webhook ─────────────────────────────────────────────────

export async function updateWebhook(
  tenantId: string,
  id: string,
  data: {
    url?: string;
    events?: string[];
    isActive?: boolean;
  }
) {
  const webhook = await prisma.webhook.findFirst({
    where: { id, tenantId },
  });
  if (!webhook) throw errors.notFound("ไม่พบ Webhook");

  return prisma.webhook.update({
    where: { id },
    data: {
      url: data.url,
      events: data.events
        ? (data.events as unknown as Prisma.InputJsonValue)
        : undefined,
      isActive: data.isActive,
    },
  });
}

// ─── Delete Webhook ─────────────────────────────────────────────────

export async function deleteWebhook(tenantId: string, id: string) {
  const webhook = await prisma.webhook.findFirst({
    where: { id, tenantId },
  });
  if (!webhook) throw errors.notFound("ไม่พบ Webhook");

  return prisma.webhook.delete({ where: { id } });
}

// ─── Trigger Webhook ────────────────────────────────────────────────

export async function triggerWebhook(
  tenantId: string,
  event: string,
  payload: Record<string, unknown>
) {
  // Find all active webhooks subscribed to this event
  const webhooks = await prisma.webhook.findMany({
    where: { tenantId, isActive: true },
  });

  const results = [];

  for (const webhook of webhooks) {
    const events = webhook.events as string[];
    if (!events.includes(event) && !events.includes("*")) continue;

    // Sign the payload
    const body = JSON.stringify(payload);
    const timestamp = Date.now().toString();
    const signature = crypto
      .createHmac("sha256", webhook.secret)
      .update(timestamp + body)
      .digest("hex");

    let statusCode: number | null = null;
    let response: string | null = null;
    const startTime = Date.now();

    try {
      // In production: actually send the webhook
      // const res = await fetch(webhook.url, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     "X-Webhook-Event": event,
      //     "X-Timestamp": timestamp,
      //     "X-Signature": signature,
      //   },
      //   body,
      // });
      // statusCode = res.status;
      // response = await res.text();

      // For dev: simulate success
      statusCode = 200;
      response = "OK (simulated)";
    } catch (err) {
      statusCode = 0;
      response = err instanceof Error ? err.message : "Unknown error";
    }

    const duration = Date.now() - startTime;

    // Log the webhook delivery
    const log = await prisma.webhookLog.create({
      data: {
        webhookId: webhook.id,
        event,
        payload: payload as Prisma.InputJsonValue,
        statusCode,
        response,
        duration,
      },
    });

    // Update last triggered
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: { lastTriggeredAt: new Date() },
    });

    results.push({ webhookId: webhook.id, logId: log.id, statusCode });
  }

  return results;
}

// ─── Get Webhook Logs ───────────────────────────────────────────────

export async function getWebhookLogs(
  tenantId: string,
  webhookId: string,
  filters: { page?: number; perPage?: number } = {}
) {
  const { page = 1, perPage = 20 } = filters;

  // Verify webhook belongs to tenant
  const webhook = await prisma.webhook.findFirst({
    where: { id: webhookId, tenantId },
  });
  if (!webhook) throw errors.notFound("ไม่พบ Webhook");

  const where = { webhookId };

  const [total, logs] = await Promise.all([
    prisma.webhookLog.count({ where }),
    prisma.webhookLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    data: logs,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  };
}
