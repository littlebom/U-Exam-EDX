"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle,
  CreditCard,
  UserPlus,
  Award,
  AlertTriangle,
  Megaphone,
  Clock,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  MOCK_NOTIFICATIONS,
  type MockNotification,
  type NotificationType,
} from "@/lib/mock-data/notifications";

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "EXAM_REMINDER":
      return <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    case "RESULT_PUBLISHED":
      return (
        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
      );
    case "PAYMENT_CONFIRMED":
      return (
        <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      );
    case "REGISTRATION_APPROVED":
    case "REGISTRATION_WAITLIST":
      return (
        <UserPlus className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      );
    case "CERTIFICATE_ISSUED":
      return <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
    case "EXAM_CANCELLED":
      return (
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
      );
    case "SYSTEM_ANNOUNCEMENT":
      return (
        <Megaphone className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      );
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
}

function getNotificationIconBg(type: NotificationType) {
  switch (type) {
    case "EXAM_REMINDER":
      return "bg-blue-100 dark:bg-blue-900/30";
    case "RESULT_PUBLISHED":
      return "bg-green-100 dark:bg-green-900/30";
    case "PAYMENT_CONFIRMED":
      return "bg-purple-100 dark:bg-purple-900/30";
    case "REGISTRATION_APPROVED":
    case "REGISTRATION_WAITLIST":
      return "bg-orange-100 dark:bg-orange-900/30";
    case "CERTIFICATE_ISSUED":
      return "bg-amber-100 dark:bg-amber-900/30";
    case "EXAM_CANCELLED":
      return "bg-red-100 dark:bg-red-900/30";
    case "SYSTEM_ANNOUNCEMENT":
      return "bg-gray-100 dark:bg-gray-900/30";
    default:
      return "bg-muted";
  }
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date("2026-03-10T14:00:00.000Z");
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMinutes < 1) return "เมื่อสักครู่";
  if (diffMinutes < 60) return `${diffMinutes} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  if (diffDays < 30) return `${diffDays} วันที่แล้ว`;
  return `${diffMonths} เดือนที่แล้ว`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] =
    useState<MockNotification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const renderNotificationList = (items: MockNotification[]) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Bell className="mb-3 h-10 w-10 opacity-30" />
          <p className="text-sm">ไม่มีการแจ้งเตือน</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((notification) => (
          <Card
            key={notification.id}
            className={cn(
              "cursor-pointer transition-colors hover:bg-accent/50",
              !notification.isRead && "border-primary/20 bg-primary/[0.02]"
            )}
            onClick={() => handleMarkAsRead(notification.id)}
          >
            <CardContent className="flex items-start gap-4 p-4">
              {/* Icon */}
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  getNotificationIconBg(notification.type)
                )}
              >
                {getNotificationIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={cn(
                      "text-sm",
                      !notification.isRead ? "font-semibold" : "font-medium"
                    )}
                  >
                    {notification.title}
                  </h3>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                    {!notification.isRead && (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {notification.message}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">การแจ้งเตือน</h1>
          <p className="text-sm text-muted-foreground">
            การแจ้งเตือนทั้งหมด {notifications.length} รายการ
            {unreadCount > 0 && ` (ยังไม่อ่าน ${unreadCount})`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
        >
          <CheckCheck className="h-4 w-4" />
          อ่านทั้งหมด
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
          <TabsTrigger value="unread">ยังไม่อ่าน</TabsTrigger>
          <TabsTrigger value="read">อ่านแล้ว</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderNotificationList(notifications)}
        </TabsContent>

        <TabsContent value="unread">
          {renderNotificationList(notifications.filter((n) => !n.isRead))}
        </TabsContent>

        <TabsContent value="read">
          {renderNotificationList(notifications.filter((n) => n.isRead))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
