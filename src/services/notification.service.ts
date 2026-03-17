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
  return prisma.notification.create({
    data: params,
  });
}
