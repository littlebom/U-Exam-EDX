"use client";

import { useState } from "react";
import { Plus, Tag, Loader2, Ticket } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useList } from "@/hooks/use-api";

interface CouponItem {
  id: string;
  code: string;
  description: string | null;
  type: string;
  value: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  validFrom: string;
  validTo: string;
}

function getCouponStatus(coupon: CouponItem): string {
  if (!coupon.isActive) return "DISABLED";
  const now = new Date();
  if (new Date(coupon.validTo) < now) return "EXPIRED";
  if (new Date(coupon.validFrom) > now) return "SCHEDULED";
  return "ACTIVE";
}

function getCouponStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          ใช้งานได้
        </Badge>
      );
    case "EXPIRED":
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
          หมดอายุ
        </Badge>
      );
    case "DISABLED":
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          ปิดใช้งาน
        </Badge>
      );
    case "SCHEDULED":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          กำหนดการ
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatDiscount(type: string, value: number) {
  if (type === "PERCENTAGE") return `${value}%`;
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CouponsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const params: Record<string, string | number> = { page, perPage: 50 };
  if (statusFilter !== "all") params.status = statusFilter;

  const { data: result, isLoading } = useList<CouponItem>(
    "coupons",
    "/api/v1/coupons",
    params
  );

  const coupons = result?.data ?? [];
  const meta = result?.meta;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">คูปองส่วนลด</h1>
          <p className="text-sm text-muted-foreground">
            {meta
              ? `คูปองทั้งหมด ${meta.total} รายการ`
              : "จัดการคูปองส่วนลดสำหรับค่าสมัครสอบ"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v); setPage(1); }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="กรองสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="ACTIVE">ใช้งานได้</SelectItem>
              <SelectItem value="EXPIRED">หมดอายุ</SelectItem>
              <SelectItem value="DISABLED">ปิดใช้งาน</SelectItem>
            </SelectContent>
          </Select>
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            สร้างคูปอง
          </Button>
        </div>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการคูปอง</CardTitle>
          <CardDescription>
            {meta
              ? `แสดง ${coupons.length} จาก ${meta.total} รายการ`
              : "กำลังโหลด..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Ticket className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">ยังไม่มีคูปอง</p>
              <p className="text-sm mt-1">สร้างคูปองส่วนลดเพื่อดึงดูดผู้สมัครสอบ</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัสคูปอง</TableHead>
                  <TableHead>ส่วนลด</TableHead>
                  <TableHead>ใช้แล้ว/ทั้งหมด</TableHead>
                  <TableHead>ใช้ได้ถึง</TableHead>
                  <TableHead>สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  const usagePercent =
                    coupon.maxUses > 0
                      ? coupon.usedCount / coupon.maxUses
                      : 0;
                  return (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm font-medium">
                            {coupon.code}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatDiscount(coupon.type, coupon.value)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {coupon.usedCount}/{coupon.maxUses || "∞"}
                          </span>
                          {coupon.maxUses > 0 && (
                            <div className="h-2 w-16 rounded-full bg-muted">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  usagePercent > 0.8
                                    ? "bg-red-500"
                                    : usagePercent > 0.5
                                      ? "bg-amber-500"
                                      : "bg-green-500"
                                )}
                                style={{ width: `${Math.min(usagePercent * 100, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(coupon.validTo)}
                      </TableCell>
                      <TableCell>{getCouponStatusBadge(status)}</TableCell>
                    </TableRow>
                  );
                })}
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
