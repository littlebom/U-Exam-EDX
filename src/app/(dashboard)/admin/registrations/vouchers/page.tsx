"use client";

import { useState } from "react";
import { QrCode, Loader2, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useList } from "@/hooks/use-api";

interface VoucherItem {
  id: string;
  code: string;
  status: string;
  isUsed: boolean;
  usedAt: string | null;
  createdAt: string;
  candidate: { id: string; name: string; email: string };
  registration: {
    id: string;
    seatNumber: string | null;
    status: string;
    examSchedule: {
      id: string;
      startDate: string;
      location: string | null;
      exam: { id: string; title: string };
    };
    testCenter: { id: string; name: string } | null;
  };
}

function getVoucherStatusBadge(status: string) {
  switch (status) {
    case "VALID":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          ใช้งานได้
        </Badge>
      );
    case "USED":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          ใช้แล้ว
        </Badge>
      );
    case "EXPIRED":
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
          หมดอายุ
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          ยกเลิก
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

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VouchersPage() {
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useList<VoucherItem>(
    "vouchers",
    "/api/v1/vouchers",
    { page, perPage: 50 }
  );

  const vouchers = result?.data ?? [];
  const meta = result?.meta;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          บัตรเข้าสอบ (Voucher)
        </h1>
        <p className="text-sm text-muted-foreground">
          {meta
            ? `บัตรเข้าสอบทั้งหมด ${meta.total} ใบ`
            : "บัตรเข้าสอบที่ออกให้ผู้สมัครสอบ"}
        </p>
      </div>

      {/* Voucher Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : vouchers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Ticket className="h-10 w-10 mb-3 opacity-50" />
          <p className="font-medium">ยังไม่มีบัตรเข้าสอบ</p>
          <p className="text-sm mt-1">บัตรเข้าสอบจะถูกสร้างเมื่อการสมัครได้รับการยืนยัน</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {vouchers.map((voucher) => (
            <Card key={voucher.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">
                    {voucher.code}
                  </span>
                  {getVoucherStatusBadge(voucher.status)}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                {/* QR Code Placeholder */}
                <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-lg bg-muted">
                  <QrCode className="h-12 w-12 text-muted-foreground" />
                </div>

                {/* Voucher Info */}
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">ผู้สมัคร: </span>
                    <span className="font-medium">{voucher.candidate.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ชุดสอบ: </span>
                    <span>{voucher.registration.examSchedule.exam.title}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">วันสอบ: </span>
                    <span>{formatDateTime(voucher.registration.examSchedule.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ที่นั่ง: </span>
                    <span className="font-mono font-medium">
                      {voucher.registration.seatNumber ?? "—"}
                    </span>
                  </div>
                  {voucher.registration.testCenter && (
                    <div>
                      <span className="text-muted-foreground">ศูนย์สอบ: </span>
                      <span>{voucher.registration.testCenter.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ก่อนหน้า
          </Button>
          <span className="text-sm text-muted-foreground">
            หน้า {meta.page} จาก {meta.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
            ถัดไป
          </Button>
        </div>
      )}
    </div>
  );
}
