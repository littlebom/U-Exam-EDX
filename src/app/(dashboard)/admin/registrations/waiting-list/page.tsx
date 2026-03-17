"use client";

import { useState } from "react";
import { Info, ListOrdered, Loader2, Users } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useList } from "@/hooks/use-api";
import { useQuery } from "@tanstack/react-query";

interface WaitingListItem {
  id: string;
  status: string;
  waitingListOrder: number | null;
  createdAt: string;
  notes: string | null;
  candidate: { id: string; name: string; email: string };
  examSchedule: {
    id: string;
    startDate: string;
    maxCandidates: number | null;
    location: string | null;
    exam: { id: string; title: string };
  };
}

interface WaitingListStats {
  total: number;
  byScheduleCount: number;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function WaitingListPage() {
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useList<WaitingListItem>(
    "waiting-list",
    "/api/v1/waiting-list",
    { page, perPage: 50 }
  );

  const { data: statsResult } = useQuery<{ success: boolean; data: WaitingListStats }>({
    queryKey: ["waiting-list-stats"],
    queryFn: async () => {
      const res = await fetch("/api/v1/waiting-list/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
  });

  const waitingList = result?.data ?? [];
  const meta = result?.meta;
  const stats = statsResult?.data;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Waiting List</h1>
        <p className="text-sm text-muted-foreground">
          รายการผู้สมัครที่อยู่ในรายการรอ
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">ผู้รอคิวทั้งหมด</CardDescription>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">จำนวนรอบสอบที่มี Waiting List</CardDescription>
            <ListOrdered className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.byScheduleCount ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/20">
        <CardContent className="flex items-start gap-3 pt-6">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              ระบบ Waiting List ทำงานอย่างไร
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-400">
              <li>เมื่อห้องสอบเต็ม ผู้สมัครจะถูกเพิ่มเข้ารายการรอโดยอัตโนมัติ</li>
              <li>เมื่อมีที่นั่งว่าง ระบบจะเลื่อนผู้สมัครตามลำดับคิว</li>
              <li>ผู้สมัครที่ถูกเลื่อนจะเปลี่ยนสถานะเป็น &quot;รอดำเนินการ&quot;</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Waiting List Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการรอ</CardTitle>
          <CardDescription>
            {meta
              ? `แสดง ${waitingList.length} จาก ${meta.total} รายการ`
              : "กำลังโหลด..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : waitingList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ListOrdered className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">ไม่มีผู้สมัครในรายการรอ</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ลำดับ</TableHead>
                  <TableHead>ผู้สมัคร</TableHead>
                  <TableHead>ชุดสอบ</TableHead>
                  <TableHead>วันสมัคร</TableHead>
                  <TableHead>สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waitingList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold">
                        {item.waitingListOrder ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.candidate.name}</div>
                        <div className="text-xs text-muted-foreground">{item.candidate.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{item.examSchedule.exam.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      >
                        รอคิว
                      </Badge>
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
