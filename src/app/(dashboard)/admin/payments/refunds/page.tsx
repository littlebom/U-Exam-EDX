"use client";

import { useState } from "react";
import {
  Loader2,
  RotateCcw,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  ArrowDownCircle,
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
import { useList } from "@/hooks/use-api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { processRefundAction } from "@/actions/payment.actions";

interface RefundItem {
  id: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
  processedAt: string | null;
  payment: {
    id: string;
    amount: number;
    method: string;
    candidate: {
      id: string;
      name: string;
      email: string;
    };
    registration?: {
      id: string;
      examSchedule?: {
        exam?: {
          title: string;
        };
      };
    };
  };
  processedBy?: {
    name: string;
  } | null;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
        >
          <Clock className="mr-1 h-3 w-3" />
          รอดำเนินการ
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        >
          <CheckCircle2 className="mr-1 h-3 w-3" />
          อนุมัติ
        </Badge>
      );
    case "PROCESSED":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
        >
          <ArrowDownCircle className="mr-1 h-3 w-3" />
          ดำเนินการแล้ว
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        >
          <Ban className="mr-1 h-3 w-3" />
          ปฏิเสธ
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function RefundsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Confirm action dialog
  const [confirmAction, setConfirmAction] = useState<{
    refund: RefundItem;
    action: "APPROVED" | "REJECTED";
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const queryClient = useQueryClient();

  const params: Record<string, string | number> = { page, perPage: 50 };
  if (statusFilter !== "all") params.status = statusFilter;

  const { data: result, isLoading } = useList<RefundItem>(
    "refunds",
    "/api/v1/refunds",
    params
  );

  const refunds = result?.data ?? [];
  const meta = result?.meta;

  // Calculate stats
  const totalCount = meta?.total ?? 0;
  const pendingCount = refunds.filter((r) => r.status === "PENDING").length;
  const approvedCount = refunds.filter(
    (r) => r.status === "APPROVED" || r.status === "PROCESSED"
  ).length;
  const rejectedCount = refunds.filter((r) => r.status === "REJECTED").length;

  const handleProcess = async () => {
    if (!confirmAction) return;
    setIsProcessing(true);
    try {
      const result = await processRefundAction(confirmAction.refund.id, {
        status: confirmAction.action,
      });
      if (result.success) {
        toast.success(
          confirmAction.action === "APPROVED"
            ? "อนุมัติคืนเงินสำเร็จ"
            : "ปฏิเสธคำขอคืนเงินสำเร็จ"
        );
        queryClient.invalidateQueries({ queryKey: ["refunds"] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดที่ไม่คาดคิด");
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">คืนเงิน</h1>
        <p className="text-sm text-muted-foreground">
          จัดการคำขอคืนเงินจากผู้สมัครสอบ
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">คำขอทั้งหมด</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">รอดำเนินการ</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {pendingCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">อนุมัติแล้ว</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {approvedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ปฏิเสธ</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {rejectedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refunds Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">รายการคืนเงิน</CardTitle>
              <CardDescription>
                {meta
                  ? `แสดง ${refunds.length} จาก ${meta.total} รายการ`
                  : "กำลังโหลด..."}
              </CardDescription>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="กรองสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="PENDING">รอดำเนินการ</SelectItem>
                <SelectItem value="APPROVED">อนุมัติ</SelectItem>
                <SelectItem value="PROCESSED">ดำเนินการแล้ว</SelectItem>
                <SelectItem value="REJECTED">ปฏิเสธ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : refunds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <RotateCcw className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">ไม่มีคำขอคืนเงิน</p>
              <p className="text-sm mt-1">
                คำขอคืนเงินจะปรากฏที่นี่เมื่อผู้สอบร้องขอ
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ผู้สมัคร</TableHead>
                  <TableHead>ข้อสอบ</TableHead>
                  <TableHead>จำนวนเงิน</TableHead>
                  <TableHead>เหตุผล</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่ขอ</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.map((refund) => (
                  <TableRow key={refund.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {refund.payment.candidate.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {refund.payment.candidate.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {refund.payment.registration?.examSchedule?.exam
                        ?.title ?? "-"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-red-600">
                          {formatCurrency(refund.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          จาก {formatCurrency(refund.payment.amount)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {refund.reason}
                      </p>
                    </TableCell>
                    <TableCell>{getStatusBadge(refund.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(refund.createdAt)}
                    </TableCell>
                    <TableCell>
                      {refund.status === "PENDING" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirmAction({
                                  refund,
                                  action: "APPROVED",
                                })
                              }
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                              อนุมัติคืนเงิน
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirmAction({
                                  refund,
                                  action: "REJECTED",
                                })
                              }
                            >
                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                              ปฏิเสธ
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
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
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ก่อนหน้า
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Action Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "APPROVED"
                ? "ยืนยันอนุมัติคืนเงิน"
                : "ยืนยันปฏิเสธคำขอคืนเงิน"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "APPROVED" ? (
                <>
                  อนุมัติคืนเงิน{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(confirmAction.refund.amount)}
                  </span>{" "}
                  ให้{" "}
                  <span className="font-semibold text-foreground">
                    {confirmAction.refund.payment.candidate.name}
                  </span>
                  ? เงินจะถูกคืนตามวิธีชำระเงินเดิม
                </>
              ) : (
                <>
                  ปฏิเสธคำขอคืนเงินของ{" "}
                  <span className="font-semibold text-foreground">
                    {confirmAction?.refund.payment.candidate.name}
                  </span>
                  ? ผู้สมัครจะได้รับแจ้งผลการพิจารณา
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProcess}
              disabled={isProcessing}
              className={
                confirmAction?.action === "APPROVED"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-destructive hover:bg-destructive/90"
              }
            >
              {isProcessing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {confirmAction?.action === "APPROVED"
                ? "อนุมัติ"
                : "ปฏิเสธ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
