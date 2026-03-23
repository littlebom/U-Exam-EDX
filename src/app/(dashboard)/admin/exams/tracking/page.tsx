"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Users,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  UserX,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TrackingSchedule {
  id: string;
  examTitle: string;
  examId: string;
  startDate: string;
  endDate: string;
  status: string;
  testCenterName: string | null;
  maxCandidates: number | null;
  registered: number;
  inProgress: number;
  submitted: number;
  absent: number;
}

export default function ExamTrackingPage() {
  const { data: result, isLoading } = useQuery<{ data: TrackingSchedule[] }>({
    queryKey: ["exam-tracking"],
    queryFn: async () => {
      const res = await fetch("/api/v1/exams/tracking");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const schedules = result?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ติดตามการสอบ</h1>
        <p className="text-sm text-muted-foreground">
          ภาพรวมผู้สอบในแต่ละรอบ — กำลังสอบ, สอบเสร็จ, ไม่มาสอบ
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : schedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="h-10 w-10 mb-3 opacity-50" />
            <p className="font-medium">ยังไม่มีรอบสอบที่เปิดอยู่</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {schedules.map((s) => {
            const total = s.registered;
            const progressPercent = total > 0 ? Math.round((s.submitted / total) * 100) : 0;

            return (
              <Link key={s.id} href={`/admin/exams/tracking/${s.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{s.examTitle}</CardTitle>
                        <CardDescription className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(s.startDate).toLocaleDateString("th-TH", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          {s.testCenterName && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {s.testCenterName}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          s.status === "ACTIVE"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                        }
                      >
                        {s.status === "ACTIVE" ? "กำลังสอบ" : "เสร็จสิ้น"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>ลงทะเบียน {total} คน</span>
                        <span>{progressPercent}% เสร็จ</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all rounded-full"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="rounded-lg bg-muted/50 p-2">
                        <Users className="h-4 w-4 mx-auto text-muted-foreground" />
                        <p className="text-lg font-bold mt-1">{total}</p>
                        <p className="text-[10px] text-muted-foreground">ลงทะเบียน</p>
                      </div>
                      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2">
                        <Clock className="h-4 w-4 mx-auto text-blue-600" />
                        <p className="text-lg font-bold mt-1 text-blue-700 dark:text-blue-400">{s.inProgress}</p>
                        <p className="text-[10px] text-muted-foreground">กำลังสอบ</p>
                      </div>
                      <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-2">
                        <CheckCircle2 className="h-4 w-4 mx-auto text-green-600" />
                        <p className="text-lg font-bold mt-1 text-green-700 dark:text-green-400">{s.submitted}</p>
                        <p className="text-[10px] text-muted-foreground">สอบเสร็จ</p>
                      </div>
                      <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-2">
                        <UserX className="h-4 w-4 mx-auto text-red-600" />
                        <p className="text-lg font-bold mt-1 text-red-700 dark:text-red-400">{s.absent}</p>
                        <p className="text-[10px] text-muted-foreground">ไม่มาสอบ</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
