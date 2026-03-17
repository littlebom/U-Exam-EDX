"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { extractPlainText } from "@/lib/content-utils";
import { ContentRenderer } from "@/components/editor";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ClipboardCheck,
  Loader2,
  Search,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useDetail, useList } from "@/hooks/use-api";
import { gradeAnswerAction } from "@/actions/grading.actions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────

interface GradingQueueItem {
  id: string;
  score: number;
  maxScore: number;
  isAutoGraded: boolean;
  feedback: string | null;
  rubricScores: Array<{ criteriaId: string; score: number; maxScore: number }> | null;
  grade: {
    id: string;
    session: {
      id: string;
      candidate: { id: string; name: string; email: string };
      examSchedule: {
        exam: { id: string; title: string };
      };
    };
  };
  answer: {
    id: string;
    answer: unknown;
    answeredAt: string | null;
    question: {
      id: string;
      type: string;
      content: unknown;
      options: unknown;
      correctAnswer: unknown;
      points: number;
    };
  };
  gradedBy: { id: string; name: string } | null;
}

interface GradingStats {
  grades: { pending: number; grading: number; completed: number; published: number };
  queue: { pending: number; graded: number };
  appeals: { total: number; pending: number };
}

interface RubricData {
  id: string;
  title: string;
  criteria: Array<{ id: string; name: string; description: string | null; maxScore: number }>;
}

// getContentText removed — using extractPlainText from @/lib/content-utils

export default function GradingPage() {
  const [blindMode, setBlindMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GradingQueueItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const gradingStartRef = useRef<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch grading queue
  const { data: queueData, isLoading: queueLoading } = useList<GradingQueueItem>(
    "grading-queue",
    "/api/v1/grades/queue",
    { status: statusFilter, search: searchQuery || undefined, perPage: 50 }
  );

  // Fetch grading stats
  const { data: stats } = useDetail<GradingStats>("grading-stats", "/api/v1/grades/stats");

  // Fetch rubrics for the exam (if selected item has exam)
  const selectedExamId = selectedItem?.grade.session.examSchedule.exam.id;
  const { data: rubrics } = useList<RubricData>(
    "rubrics",
    "/api/v1/rubrics",
    { examId: selectedExamId, perPage: 1 }
  );
  const rubric = rubrics?.data?.[0] ?? null;

  const items = queueData?.data ?? [];

  // Stats from real data
  const pendingCount = stats?.queue.pending ?? 0;
  const gradedCount = stats?.queue.graded ?? 0;
  const appealsCount = stats?.appeals.pending ?? 0;

  // Total score calculation from rubric scores
  const totalScore = useMemo(() => {
    return Object.values(rubricScores).reduce((sum, score) => sum + score, 0);
  }, [rubricScores]);

  const maxTotalScore = useMemo(() => {
    if (rubric) {
      return rubric.criteria.reduce((sum, c) => sum + c.maxScore, 0);
    }
    return selectedItem?.maxScore ?? 0;
  }, [rubric, selectedItem]);

  // Handle grade button click
  const handleGrade = useCallback((item: GradingQueueItem) => {
    setSelectedItem(item);
    gradingStartRef.current = Date.now();
    // Restore existing rubric scores if any
    if (item.rubricScores && Array.isArray(item.rubricScores)) {
      const existing: Record<string, number> = {};
      for (const rs of item.rubricScores) {
        existing[rs.criteriaId] = rs.score;
      }
      setRubricScores(existing);
    } else {
      setRubricScores({});
    }
    setFeedback(item.feedback ?? "");
    setSheetOpen(true);
  }, []);

  // Handle rubric score change
  const handleRubricScore = useCallback((criteriaId: string, value: string, maxScore: number) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      setRubricScores((prev) => {
        const next = { ...prev };
        delete next[criteriaId];
        return next;
      });
      return;
    }
    const clamped = Math.max(0, Math.min(maxScore, numValue));
    setRubricScores((prev) => ({ ...prev, [criteriaId]: clamped }));
  }, []);

  // Handle save score
  const handleSaveScore = useCallback(async () => {
    if (!selectedItem) return;

    setIsSaving(true);
    try {
      const rubricScoresArray = rubric
        ? rubric.criteria.map((c) => ({
            criteriaId: c.id,
            score: rubricScores[c.id] ?? 0,
            maxScore: c.maxScore,
          }))
        : undefined;

      const scoreToSave = rubric ? totalScore : (rubricScores["direct"] ?? 0);

      // Calculate grading duration
      const gradingDurationMs = gradingStartRef.current
        ? Date.now() - gradingStartRef.current
        : undefined;

      const result = await gradeAnswerAction(selectedItem.grade.id, {
        answerId: selectedItem.answer.id,
        score: scoreToSave,
        maxScore: selectedItem.maxScore,
        feedback: feedback || undefined,
        rubricScores: rubricScoresArray,
        gradingDurationMs,
      });

      if (result.success) {
        toast.success("บันทึกคะแนนเรียบร้อย");
        setSheetOpen(false);
        setSelectedItem(null);
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ["grading-queue"] });
        queryClient.invalidateQueries({ queryKey: ["grading-stats"] });
      } else {
        toast.error(result.error ?? "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  }, [selectedItem, rubric, rubricScores, totalScore, feedback, queryClient]);

  // Format answer for display
  const formatAnswer = (answer: unknown, type: string): string => {
    if (!answer) return "(ไม่ได้ตอบ)";
    if (type === "ESSAY" || type === "SHORT_ANSWER") {
      return typeof answer === "string" ? answer : JSON.stringify(answer);
    }
    if (typeof answer === "object" && answer !== null) {
      const obj = answer as Record<string, unknown>;
      if ("answerId" in obj) return `ตัวเลือก: ${obj.answerId}`;
      if ("answers" in obj) return String(obj.answers);
      return JSON.stringify(answer);
    }
    return String(answer);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ตรวจข้อสอบ</h1>
          <p className="text-sm text-muted-foreground">
            ตรวจข้อสอบอัตนัยและให้คะแนนตาม Rubric
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="blind-mode"
              checked={blindMode}
              onCheckedChange={(checked) => setBlindMode(checked === true)}
            />
            <Label
              htmlFor="blind-mode"
              className="flex cursor-pointer items-center gap-1.5 text-sm"
            >
              {blindMode ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Blind Mode
            </Label>
          </div>
          <Link href="/admin/grading/appeals">
            <Button variant="outline" size="sm" className="gap-1.5">
              <AlertCircle className="h-4 w-4" />
              อุทธรณ์
              <Badge
                variant="secondary"
                className="ml-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              >
                {appealsCount}
              </Badge>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">
              รอตรวจ
            </CardDescription>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
              <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">
              ตรวจแล้ว
            </CardDescription>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">
              อุทธรณ์
            </CardDescription>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appealsCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Grading Progress */}
      {(pendingCount + gradedCount) > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                ความคืบหน้าการตรวจ
              </span>
              <span className="text-sm font-semibold">
                {gradedCount} / {pendingCount + gradedCount}{" "}
                <span className="text-muted-foreground font-normal">
                  ({Math.round((gradedCount / (pendingCount + gradedCount)) * 100)}%)
                </span>
              </span>
            </div>
            <Progress
              value={Math.round((gradedCount / (pendingCount + gradedCount)) * 100)}
              className="h-2"
            />
          </CardContent>
        </Card>
      )}

      {/* Grading Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">รายการรอตรวจ</CardTitle>
              <CardDescription>
                รายการข้อสอบอัตนัยที่รอการตรวจให้คะแนน
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
          {queueLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mb-2" />
              <p className="text-sm">ไม่มีรายการรอตรวจ</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ผู้สอบ</TableHead>
                  <TableHead>ชุดสอบ</TableHead>
                  <TableHead>คำถาม</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-center">คะแนน</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const isGraded = item.feedback !== null;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">
                          {blindMode ? "****" : item.grade.session.candidate.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {blindMode ? "***@***" : item.grade.session.candidate.email}
                        </div>
                      </TableCell>
                      <TableCell>{item.grade.session.examSchedule.exam.title}</TableCell>
                      <TableCell>
                        <div className="max-w-48 truncate text-sm">
                          {extractPlainText(item.answer.question.content)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                        >
                          {item.answer.question.type === "ESSAY" ? "Essay" : item.answer.question.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isGraded ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          >
                            ตรวจแล้ว
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          >
                            รอตรวจ
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {isGraded ? `${item.score}/${item.maxScore}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={isGraded ? "outline" : "default"}
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handleGrade(item)}
                        >
                          <ClipboardCheck className="h-4 w-4" />
                          {isGraded ? "ดู" : "ตรวจ"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Grading Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl flex flex-col overflow-hidden"
          showCloseButton
        >
          <SheetHeader>
            <SheetTitle>ตรวจข้อสอบอัตนัย</SheetTitle>
            <SheetDescription>
              {selectedItem
                ? `${selectedItem.grade.session.examSchedule.exam.title} — ${extractPlainText(selectedItem.answer.question.content).slice(0, 60)}`
                : ""}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 min-h-0 px-4">
            <div className="space-y-6 pb-6">
              {/* Question */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">คำถาม</Label>
                <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
                  {selectedItem?.answer.question.content ? (
                    <ContentRenderer content={selectedItem.answer.question.content} />
                  ) : (
                    ""
                  )}
                </div>
              </div>

              <Separator />

              {/* Student Answer */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  คำตอบของผู้สอบ
                  {!blindMode && selectedItem && (
                    <span className="ml-2 font-normal text-muted-foreground">
                      ({selectedItem.grade.session.candidate.name})
                    </span>
                  )}
                </Label>
                <div className="rounded-lg border bg-background p-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedItem
                    ? formatAnswer(selectedItem.answer.answer, selectedItem.answer.question.type)
                    : ""}
                </div>
              </div>

              <Separator />

              {/* Rubric Scoring or Direct Score */}
              {rubric ? (
                <div className="space-y-4">
                  <Label className="text-sm font-semibold">
                    เกณฑ์การให้คะแนน (Rubric): {rubric.title}
                  </Label>
                  {rubric.criteria.map((criteria) => (
                    <div
                      key={criteria.id}
                      className="rounded-lg border p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {criteria.name}
                          </div>
                          {criteria.description && (
                            <div className="text-xs text-muted-foreground">
                              {criteria.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Input
                            type="number"
                            min={0}
                            max={criteria.maxScore}
                            value={rubricScores[criteria.id] ?? ""}
                            onChange={(e) =>
                              handleRubricScore(criteria.id, e.target.value, criteria.maxScore)
                            }
                            className="h-9 w-16 text-center"
                            placeholder="0"
                          />
                          <span className="text-sm text-muted-foreground">
                            / {criteria.maxScore}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">คะแนน</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={selectedItem?.maxScore ?? 0}
                      value={rubricScores["direct"] ?? ""}
                      onChange={(e) =>
                        handleRubricScore("direct", e.target.value, selectedItem?.maxScore ?? 0)
                      }
                      className="h-9 w-20 text-center"
                      placeholder="0"
                    />
                    <span className="text-sm text-muted-foreground">
                      / {selectedItem?.maxScore ?? 0}
                    </span>
                  </div>
                </div>
              )}

              <Separator />

              {/* Total Score */}
              <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">คะแนนรวม</span>
                  <span className="text-2xl font-bold text-primary">
                    {rubric ? totalScore : (rubricScores["direct"] ?? 0)}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}/ {maxTotalScore}
                    </span>
                  </span>
                </div>
              </div>

              {/* Feedback */}
              <div className="space-y-2">
                <Label htmlFor="feedback" className="text-sm font-semibold">
                  ความคิดเห็น / Feedback
                </Label>
                <Textarea
                  id="feedback"
                  placeholder="เขียนความคิดเห็นหรือข้อเสนอแนะสำหรับผู้สอบ..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-24"
                />
              </div>
            </div>
          </ScrollArea>

          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => setSheetOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleSaveScore} disabled={isSaving} className="gap-1.5">
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              บันทึกคะแนน
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
