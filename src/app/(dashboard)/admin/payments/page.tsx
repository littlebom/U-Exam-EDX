"use client";

import { useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Clock,
  RotateCcw,
  MoreHorizontal,
  Eye,
  FileDown,
  Loader2,
  CreditCard,
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
import { useList } from "@/hooks/use-api";
import { useQuery } from "@tanstack/react-query";

interface PaymentItem {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  transactionId: string | null;
  description: string | null;
  paidAt: string | null;
  createdAt: string;
  candidate: { id: string; name: string; email: string };
  registration: {
    id: string;
    examSchedule: {
      id: string;
      startDate: string;
      exam: { id: string; title: string };
    };
  };
  invoice: { id: string; invoiceNumber: string } | null;
}

interface PaymentStats {
  total: number;
  completed: number;
  pending: number;
  refunded: number;
  failed: number;
  totalRevenue: number;
}

function getPaymentMethodBadge(method: string) {
  switch (method) {
    case "PROMPTPAY":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          PromptPay
        </Badge>
      );
    case "CREDIT_CARD":
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
          Credit Card
        </Badge>
      );
    case "BANK_TRANSFER":
      return (
        <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400">
          โอนเงิน
        </Badge>
      );
    case "E_WALLET":
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
          e-Wallet
        </Badge>
      );
    default:
      return <Badge variant="outline">{method}</Badge>;
  }
}

function getPaymentStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
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
    case "FAILED":
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
          ล้มเหลว
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

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const params: Record<string, string | number> = { page, perPage: 50 };
  if (statusFilter !== "all") params.status = statusFilter;

  const { data: result, isLoading } = useList<PaymentItem>(
    "payments",
    "/api/v1/payments",
    params
  );

  const { data: statsResult } = useQuery<{ success: boolean; data: PaymentStats }>({
    queryKey: ["payment-stats"],
    queryFn: async () => {
      const res = await fetch("/api/v1/payments/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
  });

  const payments = result?.data ?? [];
  const meta = result?.meta;
  const stats = statsResult?.data;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">การชำระเงิน</h1>
        <p className="text-sm text-muted-foreground">
          จัดการรายการชำระเงินทั้งหมด
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">รายได้รวม</CardDescription>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalRevenue ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">ชำระแล้ว</CardDescription>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.completed ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">รอชำระ</CardDescription>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats?.pending ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">คืนเงิน</CardDescription>
            <RotateCcw className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.refunded ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">รายการชำระเงิน</CardTitle>
            <CardDescription>
              {meta
                ? `แสดง ${payments.length} จาก ${meta.total} รายการ`
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
              <SelectItem value="COMPLETED">ชำระแล้ว</SelectItem>
              <SelectItem value="PENDING">รอชำระ</SelectItem>
              <SelectItem value="REFUNDED">คืนเงิน</SelectItem>
              <SelectItem value="FAILED">ล้มเหลว</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CreditCard className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">ยังไม่มีรายการชำระเงิน</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่</TableHead>
                  <TableHead>ผู้ชำระ</TableHead>
                  <TableHead>ชุดสอบ</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead>วิธี</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">
                      {payment.invoice?.invoiceNumber ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.candidate.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {payment.candidate.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm">
                      {payment.registration.examSchedule.exam.title}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>{getPaymentMethodBadge(payment.method)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(payment.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            ดูรายละเอียด
                          </DropdownMenuItem>
                          {payment.invoice && (
                            <DropdownMenuItem>
                              <FileDown className="mr-2 h-4 w-4" />
                              ดาวน์โหลดใบเสร็จ
                            </DropdownMenuItem>
                          )}
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
    </div>
  );
}
