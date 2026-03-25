"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  CreditCard,
  Award,
  AlertTriangle,
  Megaphone,
  UserPlus,
  Clock,
  Loader2,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  link: string | null;
  createdAt: string;
}

// ─── Helpers ────────────────────────────────────────────────────────

function getNotificationIcon(type: string) {
  switch (type) {
    case "EXAM_REMINDER":
      return { icon: Clock, bg: "bg-blue-100 dark:bg-blue-900/30", color: "text-blue-600 dark:text-blue-400" };
    case "RESULT_PUBLISHED":
      return { icon: CheckCircle2, bg: "bg-green-100 dark:bg-green-900/30", color: "text-green-600 dark:text-green-400" };
    case "PAYMENT_COMPLETED":
    case "PAYMENT_CONFIRMED":
      return { icon: CreditCard, bg: "bg-purple-100 dark:bg-purple-900/30", color: "text-purple-600 dark:text-purple-400" };
    case "REGISTRATION_APPROVED":
    case "REGISTRATION_WAITLIST":
      return { icon: UserPlus, bg: "bg-orange-100 dark:bg-orange-900/30", color: "text-orange-600 dark:text-orange-400" };
    case "CERTIFICATE_ISSUED":
      return { icon: Award, bg: "bg-amber-100 dark:bg-amber-900/30", color: "text-amber-600 dark:text-amber-400" };
    case "EXAM_CANCELLED":
      return { icon: AlertTriangle, bg: "bg-red-100 dark:bg-red-900/30", color: "text-red-600 dark:text-red-400" };
    case "SYSTEM_ANNOUNCEMENT":
      return { icon: Megaphone, bg: "bg-gray-100 dark:bg-gray-900/30", color: "text-gray-600 dark:text-gray-400" };
    default:
      return { icon: Bell, bg: "bg-primary/10", color: "text-primary" };
  }
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "เมื่อสักครู่";
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว`;
  if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Page ───────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [tab, setTab] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const { data: result, isLoading } = useQuery<{
    data: NotificationItem[];
    meta: { total: number };
  }>({
    queryKey: ["notifications", tab],
    queryFn: async () => {
      const params = new URLSearchParams({ perPage: "50" });
      if (tab === "unread") params.set("unreadOnly", "true");
      const res = await fetch(`/api/v1/notifications?${params}`);
      return res.json();
    },
  });

  const notifications = result?.data ?? [];
  const filteredNotifications =
    tab === "read"
      ? notifications.filter((n) => n.isRead)
      : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/v1/notifications/${id}`, { method: "PUT" });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/v1/notifications", { method: "PUT" });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
      toast.success("อ่านทั้งหมดแล้ว");
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/v1/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
      toast.success("ลบแจ้งเตือนแล้ว");
    } catch {
      toast.error("เกิดข้อผิดพลาดในการลบ");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/v1/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
      toast.success("ลบแจ้งเตือนทั้งหมดแล้ว");
    } catch {
      toast.error("เกิดข้อผิดพลาดในการลบ");
    } finally {
      setIsDeleting(false);
      setShowDeleteAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">แจ้งเตือน</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0
                ? `คุณมี ${unreadCount} แจ้งเตือนที่ยังไม่ได้อ่าน`
                : "ไม่มีแจ้งเตือนใหม่"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-4 w-4" />
              อ่านทั้งหมด
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={() => setShowDeleteAll(true)}
            >
              <Trash2 className="h-4 w-4" />
              ลบทั้งหมด
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
          <TabsTrigger value="unread" className="gap-1">
            ยังไม่อ่าน
            {unreadCount > 0 && (
              <Badge className="h-5 min-w-5 p-0 text-[10px] flex items-center justify-center ml-1">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="read">อ่านแล้ว</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {tab === "all" ? "แจ้งเตือนทั้งหมด" : tab === "unread" ? "ยังไม่อ่าน" : "อ่านแล้ว"}
              </CardTitle>
              <CardDescription>
                {filteredNotifications.length} รายการ
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bell className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">ไม่มีแจ้งเตือน</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notif) => {
                    const { icon: Icon, bg, color } = getNotificationIcon(notif.type);
                    return (
                      <div
                        key={notif.id}
                        className={cn(
                          "flex items-start gap-3 py-3 px-2 rounded-md transition-colors",
                          !notif.isRead && "bg-accent/50",
                          "hover:bg-accent/30 cursor-pointer"
                        )}
                        onClick={() => {
                          if (!notif.isRead) handleMarkAsRead(notif.id);
                          if (notif.link) window.location.href = notif.link;
                        }}
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md mt-0.5",
                            bg
                          )}
                        >
                          <Icon className={cn("h-4 w-4", color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn("text-sm font-medium", !notif.isRead && "font-semibold")}>
                              {notif.title}
                            </p>
                            {!notif.isRead && (
                              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {timeAgo(notif.createdAt)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(notif.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Single Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบแจ้งเตือน</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบแจ้งเตือนนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Confirmation */}
      <AlertDialog open={showDeleteAll} onOpenChange={setShowDeleteAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบแจ้งเตือนทั้งหมด</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบแจ้งเตือนทั้งหมดหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              ลบทั้งหมด
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
