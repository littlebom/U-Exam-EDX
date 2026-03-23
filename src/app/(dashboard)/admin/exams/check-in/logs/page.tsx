"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  XCircle,
  Loader2,
  Filter,
  CalendarDays,
  Users,
  ScanFace,
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

// ============================================================
// Types
// ============================================================

interface ScheduleOption {
  id: string;
  examTitle: string;
  startDate: string;
  registrationCount: number;
}

interface LogEntry {
  id: string;
  type: string;
  description: string | null;
  severity: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  createdBy: { id: string; name: string } | null;
}

// ============================================================
// Constants
// ============================================================

const LOG_TYPE_LABELS: Record<string, string> = {
  CHECKIN: "เช็คอิน",
  LATE_CHECKIN: "เช็คอิน (สาย)",
  INCIDENT: "เหตุการณ์",
  NOTE: "บันทึก",
  CHECKIN_FAILED: "เช็คอินไม่สำเร็จ",
};

const LOG_TYPE_COLORS: Record<string, string> = {
  CHECKIN: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  LATE_CHECKIN: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  INCIDENT: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  NOTE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  CHECKIN_FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const LOG_TYPE_ICONS: Record<string, typeof CheckCircle2> = {
  CHECKIN: CheckCircle2,
  LATE_CHECKIN: Clock,
  INCIDENT: AlertTriangle,
  NOTE: FileText,
  CHECKIN_FAILED: XCircle,
};

const NONE_VALUE = "__all__";

// ============================================================
// Component
// ============================================================

export default function CheckinLogsPage() {
  const [selectedSchedule, setSelectedSchedule] = useState<string>(NONE_VALUE);
  const [filterType, setFilterType] = useState<string>(NONE_VALUE);

  // Fetch today's + recent active schedules
  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ["checkin-schedules"],
    queryFn: async () => {
      const res = await fetch("/api/v1/checkin/schedules?all=true");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      // Ensure we always return an array
      const data = json.data;
      return (Array.isArray(data) ? data : []) as ScheduleOption[];
    },
  });

  // Fetch logs for selected schedule
  const scheduleList = Array.isArray(schedules) ? schedules : [];
  const scheduleId = selectedSchedule !== NONE_VALUE ? selectedSchedule : scheduleList[0]?.id;
  const typeParam = filterType !== NONE_VALUE ? `?type=${filterType}` : "";

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["checkin-logs", scheduleId, filterType],
    queryFn: async () => {
      if (!scheduleId) return [];
      const res = await fetch(`/api/v1/checkin/logs/${scheduleId}${typeParam}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as LogEntry[];
    },
    enabled: !!scheduleId,
  });

  // Stats summary
  const checkinCount = logs?.filter((l) => l.type === "CHECKIN").length ?? 0;
  const lateCount = logs?.filter((l) => l.type === "LATE_CHECKIN").length ?? 0;
  const incidentCount = logs?.filter((l) => l.type === "INCIDENT").length ?? 0;
  const totalLogs = logs?.length ?? 0;

  const currentSchedule = scheduleList.find((s) => s.id === scheduleId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ScanFace className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Exam Day Logs</h1>
          <p className="text-sm text-muted-foreground">
            บันทึกเช็คอิน เหตุการณ์ และกิจกรรมทั้งหมดในวันสอบ
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">รอบสอบ</label>
          <Select
            value={selectedSchedule}
            onValueChange={setSelectedSchedule}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder={schedulesLoading ? "กำลังโหลด..." : "เลือกรอบสอบ"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>-- รอบสอบล่าสุด --</SelectItem>
              {scheduleList.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.examTitle} — {new Date(s.startDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">ประเภท</label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="ทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>ทั้งหมด</SelectItem>
              <SelectItem value="CHECKIN">เช็คอิน</SelectItem>
              <SelectItem value="LATE_CHECKIN">เช็คอิน (สาย)</SelectItem>
              <SelectItem value="INCIDENT">เหตุการณ์</SelectItem>
              <SelectItem value="NOTE">บันทึก</SelectItem>
              <SelectItem value="CHECKIN_FAILED">ไม่สำเร็จ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      {currentSchedule && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-xs text-muted-foreground">เช็คอิน</span>
              </div>
              <p className="text-2xl font-bold mt-1">{checkinCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">มาสาย</span>
              </div>
              <p className="text-2xl font-bold mt-1">{lateCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-muted-foreground">เหตุการณ์</span>
              </div>
              <p className="text-2xl font-bold mt-1">{incidentCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">ทั้งหมด</span>
              </div>
              <p className="text-2xl font-bold mt-1">{totalLogs}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logs Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            รายการ Logs
            {currentSchedule && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                — {currentSchedule.examTitle}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {totalLogs > 0
              ? `แสดง ${totalLogs} รายการ (ล่าสุด 50 รายการ)`
              : "ยังไม่มี logs สำหรับรอบสอบนี้"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !scheduleId ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                ไม่พบรอบสอบที่กำลังดำเนินการ
              </p>
            </div>
          ) : totalLogs === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                ยังไม่มี logs
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">เวลา</TableHead>
                    <TableHead className="w-[130px]">ประเภท</TableHead>
                    <TableHead>รายละเอียด</TableHead>
                    <TableHead className="w-[100px]">วิธี</TableHead>
                    <TableHead className="w-[120px]">โดย</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(logs ?? []).map((log) => {
                    const Icon = LOG_TYPE_ICONS[log.type] ?? FileText;
                    const meta = log.metadata;
                    const method = meta?.method as string | undefined;

                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("th-TH", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`gap-1 text-xs ${LOG_TYPE_COLORS[log.type] ?? ""}`}
                          >
                            <Icon className="h-3 w-3" />
                            {LOG_TYPE_LABELS[log.type] ?? log.type}
                          </Badge>
                          {log.severity && (
                            <Badge
                              variant="outline"
                              className={`ml-1 text-[10px] ${
                                log.severity === "HIGH"
                                  ? "border-red-300 text-red-600"
                                  : log.severity === "MEDIUM"
                                  ? "border-amber-300 text-amber-600"
                                  : "border-gray-300 text-gray-600"
                              }`}
                            >
                              {log.severity}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{log.description ?? "—"}</p>
                          {meta?.seatNumber && (
                            <span className="text-xs text-muted-foreground">
                              ที่นั่ง: {meta.seatNumber as string}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {method ? (
                            <Badge variant="outline" className="text-xs">
                              {method === "FACE" ? "Face Scan" : method}
                            </Badge>
                          ) : meta?.voucherCode ? (
                            <Badge variant="outline" className="text-xs">
                              Voucher
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.createdBy?.name ?? "ระบบ"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
