"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  FileText,
  CheckCircle2,
  ClipboardCheck,
  Send,
  Loader2,
  FileX2,
  Eye,
  FileDown,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Input } from "@/components/ui/input";
import { useDetail, useList } from "@/hooks/use-api";
import {
  publishGradeAction,
  bulkPublishGradesAction,
} from "@/actions/grading.actions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

type GradeStatus = "DRAFT" | "GRADING" | "COMPLETED" | "PUBLISHED";

interface GradeRow {
  id: string;
  totalScore: number | null;
  maxScore: number | null;
  percentage: number | null;
  isPassed: boolean | null;
  status: GradeStatus;
  gradedAt: string | null;
  publishedAt: string | null;
  session: {
    id: string;
    candidate: { id: string; name: string | null; email: string };
    examSchedule: {
      exam: { id: string; title: string };
    };
  };
  _count?: { answers: number };
}

interface GradingStats {
  grades: { pending: number; grading: number; completed: number; published: number };
  queue: { pending: number; graded: number };
  appeals: { total: number; pending: number };
}

// ============================================================
// Status Config
// ============================================================

const STATUS_CONFIG: Record<
  GradeStatus,
  { label: string; color: string; dotColor: string }
> = {
  DRAFT: {
    label: "ร่าง",
    color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    dotColor: "bg-slate-400",
  },
  GRADING: {
    label: "กำลังตรวจ",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    dotColor: "bg-amber-500",
  },
  COMPLETED: {
    label: "ตรวจแล้ว",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    dotColor: "bg-blue-500",
  },
  PUBLISHED: {
    label: "เผยแพร่แล้ว",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    dotColor: "bg-green-500",
  },
};

// ============================================================
// Filter Config
// ============================================================

type FilterKey = "ALL" | GradeStatus;

interface FilterDef {
  key: FilterKey;
  label: string;
  dotColor: string;
}

const FILTERS: FilterDef[] = [
  { key: "ALL", label: "ทั้งหมด", dotColor: "bg-slate-400" },
  { key: "DRAFT", label: "ร่าง", dotColor: "bg-slate-400" },
  { key: "GRADING", label: "กำลังตรวจ", dotColor: "bg-amber-500" },
  { key: "COMPLETED", label: "ตรวจแล้ว", dotColor: "bg-blue-500" },
  { key: "PUBLISHED", label: "เผยแพร่แล้ว", dotColor: "bg-green-500" },
];

// ============================================================
// Summary Card Config
// ============================================================

const SUMMARY_CARDS = [
  {
    label: "ทั้งหมด",
    icon: Users,
    bgColor: "bg-primary/10",
    iconColor: "text-primary",
    key: null as string | null,
  },
  {
    label: "กำลังตรวจ",
    icon: FileText,
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600",
    key: "grading",
  },
  {
    label: "ตรวจแล้ว",
    icon: CheckCircle2,
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600",
    key: "completed",
  },
  {
    label: "เผยแพร่แล้ว",
    icon: Send,
    bgColor: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600",
    key: "published",
  },
];

// ============================================================
// Helpers
// ============================================================

function formatThaiDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: GradeStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.color
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)} />
      {config.label}
    </span>
  );
}

// ============================================================
// Component
// ============================================================

export default function GradeResultsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const queryClient = useQueryClient();

  // Fetch grades
  const { data: gradeData, isLoading } = useList<GradeRow>(
    "grades",
    "/api/v1/grades",
    { perPage: 100, search: searchQuery || undefined }
  );
  const grades = gradeData?.data ?? [];

  // Fetch stats
  const { data: stats } = useDetail<GradingStats>(
    "grading-stats",
    "/api/v1/grades/stats"
  );

  // Compute counts + filter
  const { statusCounts, filteredGrades } = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: 0,
      DRAFT: 0,
      GRADING: 0,
      COMPLETED: 0,
      PUBLISHED: 0,
    };
    for (const g of grades) {
      counts.ALL++;
      if (counts[g.status] !== undefined) counts[g.status]++;
    }
    const filtered =
      activeFilter === "ALL"
        ? grades
        : grades.filter((g) => g.status === activeFilter);
    return { statusCounts: counts, filteredGrades: filtered };
  }, [grades, activeFilter]);

  // Selectable items (COMPLETED only)
  const selectableIds = useMemo(
    () => filteredGrades.filter((g) => g.status === "COMPLETED").map((g) => g.id),
    [filteredGrades]
  );

  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  };

  // Single publish
  const handlePublish = async (gradeId: string) => {
    setPublishingId(gradeId);
    try {
      const result = await publishGradeAction(gradeId);
      if (result.success) {
        toast.success("เผยแพร่คะแนนสำเร็จ");
        queryClient.invalidateQueries({ queryKey: ["grades"] });
        queryClient.invalidateQueries({ queryKey: ["grading-stats"] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setPublishingId(null);
    }
  };

  // Bulk publish
  const handleBulkPublish = async () => {
    if (selectedIds.size === 0) return;
    setIsPublishing(true);
    try {
      const result = await bulkPublishGradesAction({
        gradeIds: Array.from(selectedIds),
      });
      if (result.success) {
        toast.success(`เผยแพร่คะแนน ${selectedIds.size} รายการสำเร็จ`);
        setSelectedIds(new Set());
        queryClient.invalidateQueries({ queryKey: ["grades"] });
        queryClient.invalidateQueries({ queryKey: ["grading-stats"] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsPublishing(false);
    }
  };

  const totalCount =
    stats
      ? stats.grades.pending + stats.grades.grading + stats.grades.completed + stats.grades.published
      : statusCounts.ALL;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ผลคะแนน</h1>
          <p className="text-sm text-muted-foreground">
            ผลการตรวจข้อสอบทั้งหมด
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() =>
            window.open("/api/v1/grades/export", "_blank")
          }
        >
          <FileDown className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_CARDS.map((card) => {
          const Icon = card.icon;
          const count =
            card.key === null
              ? totalCount
              : stats?.grades[card.key as keyof typeof stats.grades] ??
                statusCounts[card.key.toUpperCase()] ??
                0;
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
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => {
          const count = statusCounts[filter.key] ?? 0;
          const isActive = activeFilter === filter.key;
          return (
            <button
              key={filter.key}
              onClick={() => {
                setActiveFilter(filter.key);
                setSelectedIds(new Set());
              }}
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

        {/* Bulk publish button */}
        {selectedIds.size > 0 && (
          <Button
            size="sm"
            onClick={handleBulkPublish}
            disabled={isPublishing}
            className="ml-auto gap-1.5"
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            เผยแพร่คะแนน ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">
                รายการผลคะแนน ({filteredGrades.length})
              </CardTitle>
              <CardDescription>
                {activeFilter === "ALL"
                  ? "แสดงผลคะแนนทั้งหมด"
                  : `กรอง: ${FILTERS.find((f) => f.key === activeFilter)?.label}`}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อ/อีเมลผู้สอบ..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredGrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileX2 className="h-10 w-10 mb-2" />
              <p className="text-sm">
                {grades.length === 0
                  ? "ยังไม่มีผลคะแนน"
                  : "ไม่พบรายการที่ตรงกับตัวกรอง"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {selectableIds.length > 0 && (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead>ผู้สอบ</TableHead>
                  <TableHead>ชุดสอบ</TableHead>
                  <TableHead className="text-center">คะแนน</TableHead>
                  <TableHead className="text-center">%</TableHead>
                  <TableHead className="text-center">ผ่าน</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="hidden md:table-cell">วันที่ตรวจ</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrades.map((grade) => {
                  const canSelect = grade.status === "COMPLETED";
                  return (
                    <TableRow key={grade.id}>
                      {selectableIds.length > 0 && (
                        <TableCell>
                          {canSelect && (
                            <Checkbox
                              checked={selectedIds.has(grade.id)}
                              onCheckedChange={() => toggleSelect(grade.id)}
                            />
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {grade.session.candidate.name || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {grade.session.candidate.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {grade.session.examSchedule.exam.title}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium text-sm">
                          {grade.totalScore ?? "—"}/{grade.maxScore ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm">
                          {grade.percentage != null
                            ? `${Math.round(grade.percentage)}%`
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {grade.isPassed === true ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          >
                            ผ่าน
                          </Badge>
                        ) : grade.isPassed === false ? (
                          <Badge
                            variant="secondary"
                            className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          >
                            ไม่ผ่าน
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={grade.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {formatThaiDate(grade.gradedAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/grading/results/${grade.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {grade.status === "COMPLETED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 h-8"
                              onClick={() => handlePublish(grade.id)}
                              disabled={publishingId === grade.id}
                            >
                              {publishingId === grade.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Send className="h-3.5 w-3.5" />
                              )}
                              เผยแพร่
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
