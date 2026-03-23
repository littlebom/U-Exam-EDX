import { prisma } from "@/lib/prisma";
import type { PaginationMeta } from "@/types";

interface NotificationListResult {
  data: Array<Record<string, unknown>>;
  meta: PaginationMeta;
}

export async function listNotifications(
  userId: string,
  params: { page?: number; perPage?: number; unreadOnly?: boolean } = {}
): Promise<NotificationListResult> {
  const page = params.page ?? 1;
  const perPage = params.perPage ?? 20;
  const skip = (page - 1) * perPage;

  const where = {
    userId,
    ...(params.unreadOnly ? { isRead: false } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where }),
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

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function sendNotification(params: {
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  // Check user preferences
  const { isChannelEnabled } = await import("@/services/notification-preference.service");

  // 1. Create in-app notification (if enabled)
  const inAppEnabled = await isChannelEnabled(params.userId, params.type, "inApp");
  let notification = null;
  if (inAppEnabled) {
    notification = await prisma.notification.create({
      data: params,
    });
  }

  // 2. Send email (if enabled, non-blocking)
  const emailEnabled = await isChannelEnabled(params.userId, params.type, "email");
  if (emailEnabled) {
    sendNotificationEmail(params).catch((err) =>
      console.error("[notification-email] error:", err)
    );
  }

  return notification;
}

// ─── Email Sending (internal) ───────────────────────────────────────

async function sendNotificationEmail(params: {
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    const { sendEmail } = await import("@/lib/mailer");
    const { renderNotificationEmail } = await import("@/lib/email-templates");

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true, name: true },
    });

    if (!user?.email) return;

    const html = renderNotificationEmail({
      title: params.title,
      message: params.message,
      link: params.link,
      type: params.type,
    });

    await sendEmail({
      to: user.email,
      subject: `[U-Exam] ${params.title}`,
      html,
      tenantId: params.tenantId,
    });
  } catch (err) {
    // Email failure should never block notification creation
    console.warn("[notification-email] Failed to send:", err);
  }
}
