"use client";

import { useState } from "react";
import {
  Wallet,
  CreditCard,
  Loader2,
  FileDown,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface PaymentHistoryItem {
  id: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  registration: {
    id: string;
    examSchedule: {
      id: string;
      exam: { id: string; title: string };
    };
  };
  invoice: { id: string; invoiceNumber: string } | null;
}

interface PaymentHistoryResponse {
  success: boolean;
  data: PaymentHistoryItem[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        >
          ชำระแล้ว
        </Badge>
      );
    case "PENDING":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
        >
          รอชำระ
        </Badge>
      );
    case "REFUNDED":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
        >
          คืนเงิน
        </Badge>
      );
    case "FAILED":
      return (
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        >
          ล้มเหลว
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getMethodLabel(method: string) {
  const labels: Record<string, string> = {
    PROMPTPAY: "PromptPay",
    CREDIT_CARD: "Credit Card",
    BANK_TRANSFER: "โอนเงิน",
    E_WALLET: "e-Wallet",
  };
  return labels[method] || method;
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

export default function WalletPage() {
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useQuery<PaymentHistoryResponse>({
    queryKey: ["candidate-payments", page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: "20",
      });
      const res = await fetch(`/api/v1/candidate/payments?${params}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const payments = result?.data ?? [];
  const meta = result?.meta;

  // Stats
  const totalPaid = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);
  const completedCount = payments.filter(
    (p) => p.status === "COMPLETED"
  ).length;
  const pendingCount = payments.filter((p) => p.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            ประวัติการชำระเงิน
          </h1>
          <p className="text-sm text-muted-foreground">
            รายการชำระเงินค่าสมัครสอบทั้งหมดของคุณ
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                ชำระเงินรวม
              </span>
              <span className="text-xl font-bold">
                {formatCurrency(totalPaid)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                ชำระสำเร็จ
              </span>
              <span className="text-xl font-bold text-green-600">
                {completedCount}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">รอชำระ</span>
              <span className="text-xl font-bold text-amber-600">
                {pendingCount}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการทั้งหมด</CardTitle>
          <CardDescription>
            {meta
              ? `ทั้งหมด ${meta.total} รายการ`
              : "กำลังโหลด..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CreditCard className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">ยังไม่มีประวัติการชำระเงิน</p>
              <p className="text-sm mt-1">
                เมื่อคุณสมัครสอบและชำระเงิน รายการจะปรากฏที่นี่
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>วันที่</TableHead>
                      <TableHead>ข้อสอบ</TableHead>
                      <TableHead>วิธีชำระ</TableHead>
                      <TableHead className="text-right">จำนวน</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(payment.paidAt || payment.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium text-sm max-w-[200px] truncate">
                          {payment.registration.examSchedule.exam.title}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getMethodLabel(payment.method)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium",
                            payment.status === "REFUNDED"
                              ? "text-blue-600"
                              : ""
                          )}
                        >
                          {payment.status === "REFUNDED" && "-"}
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          {payment.invoice && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                window.open(
                                  `/api/v1/invoices/${payment.invoice!.id}/pdf`,
                                  "_blank"
                                )
                              }
                              title="ดาวน์โหลดใบเสร็จ"
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 md:hidden">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-lg border p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-sm">
                        {payment.registration.examSchedule.exam.title}
                      </p>
                      {getStatusBadge(payment.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatDate(payment.paidAt || payment.createdAt)} ·{" "}
                        {getMethodLabel(payment.method)}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                    {payment.invoice && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5"
                        onClick={() =>
                          window.open(
                            `/api/v1/invoices/${payment.invoice!.id}/pdf`,
                            "_blank"
                          )
                        }
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        ดาวน์โหลดใบเสร็จ
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </>
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
    </div>
  );
}
