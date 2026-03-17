"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileX2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useList } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

type SessionStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT";

interface SessionRow {
  id: string;
  status: SessionStatus;
  startedAt: string | null;
  submittedAt: string | null;
  timeRemaining: number | null;
  examSchedule: {
    id: string;
    exam: { id: string; title: string; duration: number | null };
  };
  candidate: { id: string; name: string | null; email: string };
  _count: { answers: number; events: number };
}

// ============================================================
// Status Config
// ============================================================

const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; color: string; dotColor: string; animate?: boolean }
> = {
  NOT_STARTED: {
    label: "ยังไม่เริ่ม",
    color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    dotColor: "bg-slate-400",
  },
  IN_PROGRESS: {
    label: "กำลังสอบ",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    dotColor: "bg-green-500",
    animate: true,
  },
  SUBMITTED: {
    label: "ส่งแล้ว",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    dotColor: "bg-blue-500",
  },
  TIMED_OUT: {
    label: "หมดเวลา",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    dotColor: "bg-red-500",
  },
};

// ============================================================
// Filter Config
// ============================================================

type FilterKey = "ALL" | SessionStatus;

interface FilterDef {
  key: FilterKey;
  label: string;
  statuses: SessionStatus[];
  dotColor: string;
}

const FILTERS: FilterDef[] = [
  {
    key: "ALL",
    label: "ทั้งหมด",
    statuses: [],
    dotColor: "bg-slate-400",
  },
  {
    key: "IN_PROGRESS",
    label: "กำลังสอบ",
    statuses: ["IN_PROGRESS"],
    dotColor: "bg-green-500",
  },
  {
    key: "SUBMITTED",
    label: "ส่งแล้ว",
    statuses: ["SUBMITTED"],
    dotColor: "bg-blue-500",
  },
  {
    key: "TIMED_OUT",
    label: "หมดเวลา",
    statuses: ["TIMED_OUT"],
    dotColor: "bg-red-500",
  },
  {
    key: "NOT_STARTED",
    label: "ยังไม่เริ่ม",
    statuses: ["NOT_STARTED"],
    dotColor: "bg-slate-400",
  },
];

// ============================================================
// Summary Card Config
// ============================================================

interface SummaryCardDef {
  label: string;
  icon: typeof Users;
  bgColor: string;
  iconColor: string;
  countKey: SessionStatus | null; // null = total
}

const SUMMARY_CARDS: SummaryCardDef[] = [
  {
    label: "ทั้งหมด",
    icon: Users,
    bgColor: "bg-primary/10",
    iconColor: "text-primary",
    countKey: null,
  },
  {
    label: "กำลังสอบ",
    icon: Clock,
    bgColor: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600",
    countKey: "IN_PROGRESS",
  },
  {
    label: "ส่งแล้ว",
    icon: CheckCircle2,
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600",
    countKey: "SUBMITTED",
  },
  {
    label: "หมดเวลา",
    icon: AlertCircle,
    bgColor: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600",
    countKey: "TIMED_OUT",
  },
];

// ============================================================
// Helpers
// ============================================================

function formatThaiDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} ${time}`;
}

function StatusBadge({ status }: { status: SessionStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.color
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          config.dotColor,
          config.animate && "animate-pulse"
        )}
      />
      {config.label}
    </span>
  );
}

// ============================================================
// Component
// ============================================================

export default function ExamSessionsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");

  const { data, isLoading } = useList<SessionRow>(
    "exam-sessions",
    "/api/v1/exam-sessions",
    { perPage: 100 }
  );

  const sessions = data?.data ?? [];

  // Compute counts + filter
  const { statusCounts, filteredSessions } = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: 0,
      NOT_STARTED: 0,
      IN_PROGRESS: 0,
      SUBMITTED: 0,
      TIMED_OUT: 0,
    };

    for (const s of sessions) {
      counts.ALL++;
      if (counts[s.status] !== undefined) {
        counts[s.status]++;
      }
    }

    const filtered =
      activeFilter === "ALL"
        ? sessions
        : sessions.filter((s) => s.status === activeFilter);

    return { statusCounts: counts, filteredSessions: filtered };
  }, [sessions, activeFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ติดตามผู้สอบ</h1>
        <p className="text-sm text-muted-foreground">
          ติดตามสถานะการทำข้อสอบของผู้สอบ
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_CARDS.map((card) => {
          const Icon = card.icon;
          const count =
            card.countKey === null
              ? statusCounts.ALL
              : statusCounts[card.countKey] ?? 0;

          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">
                  {card.label}
                </CardDescription>
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md",
                    card.bgColor
                  )}
                >
                  <Icon className={cn("h-4 w-4", card.iconColor)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const count =
            filter.key === "ALL"
              ? statusCounts.ALL
              : statusCounts[filter.key] ?? 0;
          const isActive = activeFilter === filter.key;

          return (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isActive ? "bg-primary-foreground" : filter.dotColor
                )}
              />
              {filter.label}
              <span
                className={cn(
                  "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px]",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background text-muted-foreground"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            รายการผู้สอบ ({filteredSessions.length})
          </CardTitle>
          <CardDescription>
            {activeFilter === "ALL"
              ? "แสดงรายการทำข้อสอบทั้งหมด"
              : `กรอง: ${FILTERS.find((f) => f.key === activeFilter)?.label}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ผู้สอบ</TableHead>
                <TableHead>ชุดข้อสอบ</TableHead>
                <TableHead>เริ่มสอบ</TableHead>
                <TableHead>ส่งคำตอบ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">ตอบแล้ว</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center"
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileX2 className="h-8 w-8" />
                      <p className="text-sm">
                        {sessions.length === 0
                          ? "ยังไม่มีข้อมูลการทำข้อสอบ"
                          : "ไม่พบรายการที่ตรงกับตัวกรอง"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">
                          {session.candidate.name || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.candidate.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {session.examSchedule.exam.title}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatThaiDateTime(session.startedAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatThaiDateTime(session.submittedAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={session.status} />
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm">
                        {session._count.answers} ข้อ
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
