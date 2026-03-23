"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Loader2,
  Plus,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";
import { useList } from "@/hooks/use-api";
import { ScheduleCard, type ScheduleRow } from "@/components/exam-schedule/schedule-card";
import { ScheduleFormDialog } from "@/components/exam-schedule/schedule-form-dialog";
import { getSchedulePhase, type SchedulePhase } from "@/lib/schedule-utils";
import { cancelScheduleAction } from "@/actions/exam-schedule.actions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// ============================================================
// Constants
// ============================================================

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const DAY_HEADERS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-500",
  ACTIVE: "bg-green-500",
  COMPLETED: "bg-gray-400",
  CANCELLED: "bg-red-400",
};

function toThaiYear(year: number): number {
  return year + 543;
}

// Phase filter definitions
type PhaseFilterKey = "ALL" | "ACTIVE" | "OPEN_REG" | "COMPLETED" | "CANCELLED";

interface PhaseFilterDef {
  key: PhaseFilterKey;
  label: string;
  phases: SchedulePhase[];
  dotColor: string;
}

const PHASE_FILTERS: PhaseFilterDef[] = [
  { key: "ALL", label: "ทั้งหมด", phases: [], dotColor: "" },
  {
    key: "ACTIVE",
    label: "กำลังดำเนินการ",
    phases: ["IN_PROGRESS", "CLOSED_REG", "SCHEDULED"],
    dotColor: "bg-green-500",
  },
  {
    key: "OPEN_REG",
    label: "เปิดรับสมัคร",
    phases: ["OPEN_REG"],
    dotColor: "bg-blue-500",
  },
  {
    key: "COMPLETED",
    label: "เสร็จสิ้น",
    phases: ["COMPLETED"],
    dotColor: "bg-gray-400",
  },
  {
    key: "CANCELLED",
    label: "ยกเลิก",
    phases: ["CANCELLED"],
    dotColor: "bg-red-500",
  },
];

// ============================================================
// Page Component
// ============================================================

export default function ExamSchedulePage() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [activeTab, setActiveTab] = useState("list");
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilterKey>("ALL");

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleRow | null>(null);

  // Cancel confirmation state
  const [cancelTarget, setCancelTarget] = useState<ScheduleRow | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const queryClient = useQueryClient();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { data, isLoading } = useList<ScheduleRow>(
    "exam-schedules",
    "/api/v1/exam-schedules",
    { perPage: 100 }
  );

  const schedules = data?.data ?? [];

  // Invalidate and refetch
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["exam-schedules"] });
  }, [queryClient]);

  // Handlers
  const handleCreate = () => {
    setEditingSchedule(null);
    setFormOpen(true);
  };

  const handleEdit = (schedule: ScheduleRow) => {
    setEditingSchedule(schedule);
    setFormOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    try {
      const result = await cancelScheduleAction(cancelTarget.id);
      if (result.success) {
        toast.success("ยกเลิกรอบสอบสำเร็จ");
        refresh();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsCancelling(false);
      setCancelTarget(null);
    }
  };

  // ── Calendar logic ──────────────────────────────────
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: { date: number; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = month === 0 ? 11 : month - 1;
      const y = month === 0 ? year - 1 : year;
      days.push({
        date: d,
        isCurrentMonth: false,
        dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: d,
        isCurrentMonth: true,
        dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      days.push({
        date: d,
        isCurrentMonth: false,
        dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      });
    }

    return days;
  }, [year, month]);

  // Map schedules to calendar dates
  const eventsByDate = useMemo(() => {
    const map = new Map<string, { id: string; title: string; color: string }[]>();

    for (const schedule of schedules) {
      const startDate = new Date(schedule.startDate);
      const dateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;

      const existing = map.get(dateStr) || [];
      existing.push({
        id: schedule.id,
        title: schedule.exam.title,
        color: STATUS_COLORS[schedule.status] ?? "bg-gray-500",
      });
      map.set(dateStr, existing);
    }

    return map;
  }, [schedules]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Compute phase for each schedule + counts + filtered list
  const { phaseCounts, filteredSchedules } = useMemo(() => {
    const counts: Record<PhaseFilterKey, number> = {
      ALL: schedules.length,
      ACTIVE: 0,
      OPEN_REG: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    const withPhase = schedules.map((s) => {
      const phase = getSchedulePhase(s).phase;
      return { schedule: s, phase };
    });

    // Count per filter group
    for (const { phase } of withPhase) {
      for (const filter of PHASE_FILTERS) {
        if (filter.key !== "ALL" && filter.phases.includes(phase)) {
          counts[filter.key]++;
        }
      }
    }

    // Filter
    const activeFilter = PHASE_FILTERS.find((f) => f.key === phaseFilter);
    const filtered =
      phaseFilter === "ALL"
        ? withPhase
        : withPhase.filter(
            ({ phase }) => activeFilter?.phases.includes(phase) ?? false
          );

    // Sort: upcoming first
    filtered.sort(
      (a, b) =>
        new Date(a.schedule.startDate).getTime() -
        new Date(b.schedule.startDate).getTime()
    );

    return {
      phaseCounts: counts,
      filteredSchedules: filtered.map(({ schedule }) => schedule),
    };
  }, [schedules, phaseFilter]);

  // ── Loading state ───────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ตารางสอบ</h1>
          <p className="text-sm text-muted-foreground">
            จัดการรอบสอบทั้งหมด
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          เพิ่มรอบสอบ
        </Button>
      </div>

      {/* Tabs: List / Calendar */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list" className="gap-1.5">
            <List className="h-4 w-4" />
            รายการ
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5">
            <CalendarDays className="h-4 w-4" />
            ปฏิทิน
          </TabsTrigger>
        </TabsList>

        {/* ── List View ── */}
        <TabsContent value="list" className="space-y-4">
          {/* Phase filter chips */}
          <div className="flex flex-wrap gap-2">
            {PHASE_FILTERS.map((filter) => {
              const count = phaseCounts[filter.key];
              const isActive = phaseFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  onClick={() => setPhaseFilter(filter.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {filter.dotColor && (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        isActive ? "bg-primary-foreground/70" : filter.dotColor
                      )}
                    />
                  )}
                  {filter.label}
                  <span
                    className={cn(
                      "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-background text-foreground/60"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Schedule cards */}
          {filteredSchedules.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">
                    {phaseFilter === "ALL"
                      ? "ยังไม่มีรอบสอบ"
                      : "ไม่มีรอบสอบในสถานะนี้"}
                  </p>
                  <p className="text-xs mt-1">
                    {phaseFilter === "ALL"
                      ? 'คลิก "เพิ่มรอบสอบ" เพื่อสร้างรอบสอบใหม่'
                      : "ลองเลือกสถานะอื่นเพื่อดูรอบสอบ"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSchedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onEdit={handleEdit}
                  onCancel={setCancelTarget}
                  onSetCertificate={handleEdit}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Calendar View ── */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">
                    {THAI_MONTHS[month]} {toThaiYear(year)}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevMonth}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">เดือนก่อนหน้า</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentDate(
                        new Date(today.getFullYear(), today.getMonth(), 1)
                      )
                    }
                    className="h-8 px-3 text-xs"
                  >
                    วันนี้
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextMonth}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">เดือนถัดไป</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_HEADERS.map((day, idx) => (
                  <div
                    key={day}
                    className={cn(
                      "py-2 text-center text-xs font-medium text-muted-foreground",
                      idx === 0 && "text-red-500"
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 border-t border-l">
                {calendarDays.map((day, idx) => {
                  const events = eventsByDate.get(day.dateStr) || [];
                  const isToday = day.dateStr === todayStr;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "min-h-[80px] border-r border-b p-1.5 transition-colors",
                        !day.isCurrentMonth && "bg-muted/30",
                        isToday && "bg-primary/5"
                      )}
                    >
                      <div
                        className={cn(
                          "text-xs font-medium mb-1",
                          !day.isCurrentMonth && "text-muted-foreground/50",
                          isToday &&
                            "inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground",
                          idx % 7 === 0 &&
                            day.isCurrentMonth &&
                            "text-red-500"
                        )}
                      >
                        {day.date}
                      </div>
                      <div className="space-y-0.5">
                        {events.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-muted/50 cursor-pointer"
                          >
                            <div
                              className={cn(
                                "h-1.5 w-1.5 rounded-full shrink-0",
                                ev.color
                              )}
                            />
                            <span className="text-[10px] leading-tight truncate">
                              {ev.title}
                            </span>
                          </div>
                        ))}
                        {events.length > 2 && (
                          <span className="text-[10px] text-muted-foreground pl-1">
                            +{events.length - 2} อื่น ๆ
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <div className={cn("h-2 w-2 rounded-full", color)} />
                    <span>
                      {status === "SCHEDULED"
                        ? "กำหนดการ"
                        : status === "ACTIVE"
                          ? "กำลังดำเนินการ"
                          : status === "COMPLETED"
                            ? "เสร็จสิ้น"
                            : "ยกเลิก"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Form Dialog */}
      <ScheduleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        schedule={editingSchedule}
        onSaved={refresh}
      />

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันยกเลิกรอบสอบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการยกเลิกรอบสอบ &quot;{cancelTarget?.exam.title}&quot;
              หรือไม่? การยกเลิกจะไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              ไม่ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังยกเลิก...
                </>
              ) : (
                "ยืนยันยกเลิก"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
