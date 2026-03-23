"use client";

import { useState } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  ListOrdered,
  Loader2,
  MoreHorizontal,
  Trash2,
  Ban,
  BadgeCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { useList } from "@/hooks/use-api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  updateRegistrationAction,
  deleteRegistrationAction,
} from "@/actions/registration.actions";
import { toast } from "sonner";

interface RegistrationItem {
  id: string;
  status: string;
  paymentStatus: string;
  amount: number;
  seatNumber: string | null;
  notes: string | null;
  createdAt: string;
  candidate: { id: string; name: string; email: string };
  examSchedule: {
    id: string;
    startDate: string;
    location: string | null;
    exam: { id: string; title: string };
  };
  testCenter: { id: string; name: string } | null;
}

interface RegistrationStats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  waitingList: number;
}

function getRegistrationStatusBadge(status: string) {
  switch (status) {
    case "CONFIRMED":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          ยืนยันแล้ว
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          รอดำเนินการ
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          ยกเลิก
        </Badge>
      );
    case "WAITING_LIST":
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
          Waiting List
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getPaymentStatusBadge(status: string) {
  switch (status) {
    case "PAID":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          ชำระแล้ว
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          รอชำระ
        </Badge>
      );
    case "REFUNDED":
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          คืนเงิน
        </Badge>
      );
    case "WAIVED":
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
          ยกเว้น
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function RegistrationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<RegistrationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const params: Record<string, string | number> = { page, perPage: 50 };
  if (statusFilter !== "all") params.status = statusFilter;

  const { data: result, isLoading } = useList<RegistrationItem>(
    "registrations",
    "/api/v1/registrations",
    params
  );

  const { data: statsResult } = useQuery<{ success: boolean; data: RegistrationStats }>({
    queryKey: ["registration-stats"],
    queryFn: async () => {
      const res = await fetch("/api/v1/registrations/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
  });

  const registrations = result?.data ?? [];
  const meta = result?.meta;
  const stats = statsResult?.data;

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["registrations"] });
    queryClient.invalidateQueries({ queryKey: ["registration-stats"] });
  };

  const handleConfirm = async (reg: RegistrationItem) => {
    const res = await updateRegistrationAction(reg.id, { status: "CONFIRMED" });
    if (res.success) {
      toast.success(`ยืนยันการสมัครของ ${reg.candidate.name} สำเร็จ`);
      refreshData();
    } else {
      toast.error(res.error || "เกิดข้อผิดพลาด");
    }
  };

  const handleCancel = async (reg: RegistrationItem) => {
    const res = await updateRegistrationAction(reg.id, { status: "CANCELLED" });
    if (res.success) {
      toast.success(`ยกเลิกการสมัครของ ${reg.candidate.name} สำเร็จ`);
      refreshData();
    } else {
      toast.error(res.error || "เกิดข้อผิดพลาด");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteRegistrationAction(deleteTarget.id);
      if (res.success) {
        toast.success(`ลบการสมัครของ ${deleteTarget.candidate.name} สำเร็จ`);
        refreshData();
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">การสมัครสอบ</h1>
        <p className="text-sm text-muted-foreground">
          จัดการรายการสมัครสอบทั้งหมด
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">ทั้งหมด</CardDescription>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">ยืนยัน</CardDescription>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.confirmed ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">รอดำเนินการ</CardDescription>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats?.pending ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">ยกเลิก</CardDescription>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.cancelled ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">Waiting List</CardDescription>
            <ListOrdered className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.waitingList ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Registrations Table */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">รายการสมัครสอบ</CardTitle>
            <CardDescription>
              {meta
                ? `แสดง ${registrations.length} จาก ${meta.total} รายการ`
                : "กำลังโหลด..."}
            </CardDescription>
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v); setPage(1); }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="กรองสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="CONFIRMED">ยืนยันแล้ว</SelectItem>
              <SelectItem value="PENDING">รอดำเนินการ</SelectItem>
              <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
              <SelectItem value="WAITING_LIST">Waiting List</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">ยังไม่มีการสมัครสอบ</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ผู้สมัคร</TableHead>
                  <TableHead>ชุดสอบ</TableHead>
                  <TableHead>ศูนย์สอบ</TableHead>
                  <TableHead>ที่นั่ง</TableHead>
                  <TableHead>วันสมัคร</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>การชำระเงิน</TableHead>
                  <TableHead className="w-[60px]">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reg.candidate.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {reg.candidate.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {reg.examSchedule.exam.title}
                    </TableCell>
                    <TableCell className="text-sm">
                      {reg.testCenter?.name ?? reg.examSchedule.location ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {reg.seatNumber ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(reg.createdAt)}
                    </TableCell>
                    <TableCell>
                      {getRegistrationStatusBadge(reg.status)}
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(reg.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(reg.status === "PENDING" || reg.status === "WAITING_LIST") && (
                            <DropdownMenuItem onClick={() => handleConfirm(reg)}>
                              <BadgeCheck className="mr-2 h-4 w-4 text-green-600" />
                              ยืนยันการสมัคร
                            </DropdownMenuItem>
                          )}
                          {reg.status !== "CANCELLED" && (
                            <DropdownMenuItem onClick={() => handleCancel(reg)}>
                              <Ban className="mr-2 h-4 w-4 text-amber-600" />
                              ยกเลิกการสมัคร
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(reg)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            ลบการสมัคร
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                หน้า {meta.page} จาก {meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ก่อนหน้า
                </Button>
                <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบการสมัครสอบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบการสมัครของ{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.candidate.name}
              </span>{" "}
              ในรอบสอบ{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.examSchedule.exam.title}
              </span>{" "}
              หรือไม่? การลบจะไม่สามารถกู้คืนได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                "ลบการสมัคร"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
