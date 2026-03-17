"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Loader2,
  ClipboardList,
  Calendar,
  ExternalLink,
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
import { useQuery } from "@tanstack/react-query";

// ─── Types ──────────────────────────────────────────────────────────

interface RegistrationItem {
  id: string;
  examTitle: string;
  examDate: string;
  scheduleStatus: string;
  testCenter: { id: string; name: string } | null;
  seatNumber: string | null;
  status: string;
  paymentStatus: string;
  payment: { id: string; amount: number; status: string; method: string } | null;
  voucher: { code: string; status: string; isUsed: boolean } | null;
  createdAt: string;
}

interface RegistrationResponse {
  success: boolean;
  data: RegistrationItem[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
}

// ─── Helpers ────────────────────────────────────────────────────────

function getStatusBadge(status: string) {
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
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          Waiting List
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getPaymentBadge(status: string) {
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
        <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
          คืนเงิน
        </Badge>
      );
    case "WAIVED":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          ยกเว้น
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Page ───────────────────────────────────────────────────────────

export default function RegistrationHistoryPage() {
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useQuery<RegistrationResponse>({
    queryKey: ["profile-registrations", page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), perPage: "20" });
      const res = await fetch(`/api/v1/profile/registrations?${params}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const registrations = result?.data ?? [];
  const meta = result?.meta;

  // Stats
  const confirmedCount = registrations.filter((r) => r.status === "CONFIRMED").length;
  const pendingCount = registrations.filter((r) => r.status === "PENDING").length;
  const waitingCount = registrations.filter((r) => r.status === "WAITING_LIST").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ประวัติสมัครสอบ</h1>
          <p className="text-sm text-muted-foreground">
            รายการสมัครสอบทั้งหมดของคุณ
          </p>
        </div>
        <Button asChild>
          <Link href="/catalog" className="gap-1.5">
            <ExternalLink className="h-4 w-4" />
            ค้นหาสอบใหม่
          </Link>
        </Button>
      </div>

      {/* Stats */}
      {!isLoading && meta && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ทั้งหมด</span>
                <span className="text-2xl font-bold">{meta.total}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ยืนยันแล้ว</span>
                <span className="text-2xl font-bold text-green-600">{confirmedCount}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">รอดำเนินการ</span>
                <span className="text-2xl font-bold text-amber-600">{pendingCount}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Waiting List</span>
                <span className="text-2xl font-bold text-blue-600">{waitingCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการสมัครสอบ</CardTitle>
          <CardDescription>
            {meta ? `ทั้งหมด ${meta.total} รายการ` : "กำลังโหลด..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ClipboardList className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">ยังไม่มีประวัติสมัครสอบ</p>
              <p className="text-sm mt-1">
                ค้นหาและสมัครสอบได้ที่{" "}
                <Link href="/catalog" className="text-primary underline">
                  รายการสอบ
                </Link>
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ชื่อสอบ</TableHead>
                      <TableHead>วันสอบ</TableHead>
                      <TableHead>ศูนย์สอบ</TableHead>
                      <TableHead>ที่นั่ง</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>การชำระเงิน</TableHead>
                      <TableHead>Voucher</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <p className="font-medium text-sm">{r.examTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            สมัครเมื่อ {formatDate(r.createdAt)}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDate(r.examDate)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.testCenter?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {r.seatNumber ?? "—"}
                        </TableCell>
                        <TableCell>{getStatusBadge(r.status)}</TableCell>
                        <TableCell>{getPaymentBadge(r.paymentStatus)}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {r.voucher?.code ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 md:hidden">
                {registrations.map((r) => (
                  <div key={r.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-sm">{r.examTitle}</p>
                      {getStatusBadge(r.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(r.examDate)}
                      </span>
                      {r.testCenter && <span>{r.testCenter.name}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {getPaymentBadge(r.paymentStatus)}
                      {r.seatNumber && (
                        <span className="text-xs font-mono text-muted-foreground">
                          ที่นั่ง: {r.seatNumber}
                        </span>
                      )}
                      {r.voucher && (
                        <span className="text-xs font-mono text-muted-foreground">
                          {r.voucher.code}
                        </span>
                      )}
                    </div>
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
