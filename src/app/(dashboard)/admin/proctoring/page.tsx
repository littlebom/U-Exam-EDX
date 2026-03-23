"use client";

import { Eye, Users, AlertTriangle, ShieldCheck, Loader2, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────

interface ScheduleProctoring {
  scheduleId: string;
  examTitle: string;
  startDate: string;
  endDate: string;
  testCenterName: string | null;
  totalSessions: number;
  monitoring: number;
  flagged: number;
  reviewed: number;
  incidentCount: number;
}

// ─── Page ───────────────────────────────────────────────────────────

export default function ProctoringDashboardPage() {
  const { data: schedules, isLoading } = useQuery<ScheduleProctoring[]>({
    queryKey: ["proctoring-schedules"],
    queryFn: async () => {
      const res = await fetch("/api/v1/proctoring?view=schedules");
      const json = await res.json();
      return json.data ?? [];
    },
    refetchInterval: 15000,
  });

  const totalSessions = schedules?.reduce((sum, s) => sum + s.totalSessions, 0) ?? 0;
  const totalFlagged = schedules?.reduce((sum, s) => sum + s.flagged, 0) ?? 0;
  const totalIncidents = schedules?.reduce((sum, s) => sum + s.incidentCount, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          คุมสอบออนไลน์ — Live Monitor
        </h1>
        <p className="text-sm text-muted-foreground">
          เลือกรอบสอบเพื่อติดตามผู้สอบแบบเรียลไทม์
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">รอบสอบ</span>
              <Monitor className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="mt-1 text-2xl font-bold">{schedules?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">กำลังสอบ</span>
              <Users className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="mt-1 text-2xl font-bold text-green-600">{totalSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ตรวจพบ</span>
              <AlertTriangle className="h-5 w-5 text-amber-500/50" />
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-600">{totalFlagged}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Incidents</span>
              <ShieldCheck className="h-5 w-5 text-red-500/50" />
            </div>
            <p className="mt-1 text-2xl font-bold text-red-600">{totalIncidents}</p>
          </CardContent>
        </Card>
      </div>

      {/* Schedule List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !schedules || schedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Eye className="h-10 w-10 mb-3 opacity-50" />
            <p className="font-medium">ไม่มีรอบสอบที่กำลังดำเนินการ</p>
            <p className="text-sm">เมื่อมีผู้สอบเริ่มทำข้อสอบ จะแสดงที่นี่</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schedules.map((schedule) => (
            <Link
              key={schedule.scheduleId}
              href={`/admin/proctoring/${schedule.scheduleId}`}
            >
              <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base line-clamp-1">
                    {schedule.examTitle}
                  </CardTitle>
                  <CardDescription>
                    {new Date(schedule.startDate).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    {new Date(schedule.startDate).toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" — "}
                    {new Date(schedule.endDate).toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {schedule.testCenterName && (
                    <p className="text-xs text-muted-foreground mb-3">
                      📍 {schedule.testCenterName}
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {schedule.totalSessions} คน
                    </Badge>
                    {schedule.monitoring > 0 && (
                      <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        🟢 {schedule.monitoring} ปกติ
                      </Badge>
                    )}
                    {schedule.flagged > 0 && (
                      <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        🔴 {schedule.flagged} ตรวจพบ
                      </Badge>
                    )}
                    {schedule.incidentCount > 0 && (
                      <Badge variant="secondary" className="gap-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        ⚠️ {schedule.incidentCount} incidents
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 flex justify-end">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" tabIndex={-1}>
                      <Eye className="h-3 w-3" />
                      เข้าดู
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
