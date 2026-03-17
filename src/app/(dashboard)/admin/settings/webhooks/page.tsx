"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Webhook,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  Power,
  PowerOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type WebhookItem = {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
  _count?: { logs: number };
};

const AVAILABLE_EVENTS = [
  "exam.completed",
  "exam.published",
  "certificate.issued",
  "payment.confirmed",
  "payment.refunded",
  "registration.approved",
  "registration.cancelled",
  "grading.finalized",
];

function getEventBadge(event: string) {
  const colorMap: Record<string, string> = {
    "exam.completed":
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    "exam.published":
      "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
    "certificate.issued":
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    "payment.confirmed":
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    "payment.refunded":
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    "registration.approved":
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    "registration.cancelled":
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    "grading.finalized":
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  };

  return (
    <Badge
      key={event}
      variant="secondary"
      className={cn("text-xs", colorMap[event] ?? "")}
    >
      {event}
    </Badge>
  );
}

export default function WebhooksPage() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const res = await fetch("/api/v1/webhooks");
      const json = await res.json();
      return json;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl, events: selectedEvents }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "เกิดข้อผิดพลาด");
      }
      return res.json();
    },
    onSuccess: () => {
      setShowCreateDialog(false);
      setNewUrl("");
      setSelectedEvents([]);
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("สร้าง Webhook สำเร็จ");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => {
      const res = await fetch(`/api/v1/webhooks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "เกิดข้อผิดพลาด");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/webhooks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "เกิดข้อผิดพลาด");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("ลบ Webhook สำเร็จ");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const webhooks: WebhookItem[] = data?.data ?? [];

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Webhook Configuration
          </h1>
          <p className="text-sm text-muted-foreground">
            ตั้งค่า Webhook สำหรับรับ/ส่งเหตุการณ์ระหว่างระบบ
          </p>
        </div>
        <Button className="gap-1.5" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          เพิ่ม Webhook
        </Button>
      </div>

      {/* Webhooks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการ Webhooks</CardTitle>
          <CardDescription>
            ทั้งหมด {webhooks.length} รายการ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Webhook className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                ยังไม่มี Webhook
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ส่งล่าสุด</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Webhook className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <code className="max-w-[300px] truncate text-sm">
                          {webhook.url}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(webhook.events as string[]).map((event) =>
                          getEventBadge(event)
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {webhook.isActive ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                        >
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {webhook.lastTriggeredAt
                        ? new Date(webhook.lastTriggeredAt).toLocaleDateString(
                            "th-TH",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "ยังไม่เคยส่ง"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              toggleMutation.mutate({
                                id: webhook.id,
                                isActive: !webhook.isActive,
                              })
                            }
                          >
                            {webhook.isActive ? (
                              <>
                                <PowerOff className="mr-2 h-4 w-4" />
                                ปิดใช้งาน
                              </>
                            ) : (
                              <>
                                <Power className="mr-2 h-4 w-4" />
                                เปิดใช้งาน
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(webhook.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            ลบ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Webhook Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่ม Webhook ใหม่</DialogTitle>
            <DialogDescription>
              ระบุ URL ปลายทางและเลือก Events ที่ต้องการรับ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Endpoint URL</Label>
              <Input
                id="webhook-url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com/webhooks/uexam"
              />
            </div>
            <div className="space-y-2">
              <Label>Events</Label>
              <div className="grid grid-cols-1 gap-2 rounded-lg border p-3">
                {AVAILABLE_EVENTS.map((event) => (
                  <div key={event} className="flex items-center gap-2">
                    <Checkbox
                      id={`event-${event}`}
                      checked={selectedEvents.includes(event)}
                      onCheckedChange={() => toggleEvent(event)}
                    />
                    <Label
                      htmlFor={`event-${event}`}
                      className="cursor-pointer font-mono text-sm"
                    >
                      {event}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={
                !newUrl.trim() ||
                selectedEvents.length === 0 ||
                createMutation.isPending
              }
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              สร้าง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
