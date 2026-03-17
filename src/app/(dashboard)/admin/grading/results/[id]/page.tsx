"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  Clock,
  User,
  FileText,
  PenLine,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useDetail } from "@/hooks/use-api";
import {
  publishGradeAction,
  adjustScoreAction,
} from "@/actions/grading.actions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

type GradeStatus = "DRAFT" | "GRADING" | "COMPLETED" | "PUBLISHED";

interface GradeAnswer {
  id: string;
  score: number;
  maxScore: number;
  feedback: string | null;
  isAutoGraded: boolean;
  createdAt: string;
  answer: {
    id: string;
    content: string | null;
    selectedOptions: string[] | null;
    question: {
      id: string;
      type: string;
      content: string;
      options: unknown;
      correctAnswer: unknown;
      points: number;
    };
  };
  gradedBy: { id: string; name: string | null } | null;
}

interface GradeDetail {
  id: string;
  totalScore: number | null;
  maxScore: number | null;
  percentage: number | null;
  isPassed: boolean | null;
  status: GradeStatus;
  gradedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  session: {
    id: string;
    startedAt: string | null;
    submittedAt: string | null;
    candidate: { id: string; name: string | null; email: string };
    examSchedule: {
      exam: {
        id: string;
        title: string;
        passingScore: number | null;
        totalPoints: number | null;
      };
    };
  };
  gradeAnswers: GradeAnswer[];
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

const QUESTION_TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "ปรนัย",
  TRUE_FALSE: "ถูก/ผิด",
  SHORT_ANSWER: "ตอบสั้น",
  ESSAY: "อัตนัย",
  MATCHING: "จับคู่",
  ORDERING: "เรียงลำดับ",
  FILL_IN_BLANK: "เติมคำ",
  IMAGE_BASED: "รูปภาพ",
};

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
    hour: "2-digit",
    minute: "2-digit",
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

function getScoreColor(score: number, maxScore: number): string {
  if (maxScore === 0) return "text-muted-foreground";
  const pct = (score / maxScore) * 100;
  if (pct >= 80) return "text-green-600 dark:text-green-400";
  if (pct >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreBg(score: number, maxScore: number): string {
  if (maxScore === 0) return "";
  const pct = (score / maxScore) * 100;
  if (pct >= 80) return "bg-green-50 dark:bg-green-900/10";
  if (pct >= 50) return "bg-amber-50 dark:bg-amber-900/10";
  return "bg-red-50 dark:bg-red-900/10";
}

// ============================================================
// Component
// ============================================================

export default function GradeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gradeId = params.id as string;

  const queryClient = useQueryClient();

  const [isPublishing, setIsPublishing] = useState(false);
  const [adjustDialog, setAdjustDialog] = useState<{
    open: boolean;
    answerId: string;
    currentScore: number;
    maxScore: number;
  }>({ open: false, answerId: "", currentScore: 0, maxScore: 0 });
  const [adjustScore, setAdjustScore] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Fetch grade detail
  const { data: grade, isLoading } = useDetail<GradeDetail>(
    "grade-detail",
    `/api/v1/grades/${gradeId}`
  );

  // Publish
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const result = await publishGradeAction(gradeId);
      if (result.success) {
        toast.success("เผยแพร่คะแนนสำเร็จ");
        queryClient.invalidateQueries({ queryKey: ["grade-detail"] });
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

  // Adjust score
  const openAdjustDialog = (answerId: string, currentScore: number, maxScore: number) => {
    setAdjustDialog({ open: true, answerId, currentScore, maxScore });
    setAdjustScore(String(currentScore));
    setAdjustReason("");
  };

  const handleAdjustScore = async () => {
    const newScore = parseFloat(adjustScore);
    if (isNaN(newScore) || newScore < 0) {
      toast.error("กรุณากรอกคะแนนที่ถูกต้อง");
      return;
    }
    if (!adjustReason.trim()) {
      toast.error("กรุณาระบุเหตุผลในการปรับคะแนน");
      return;
    }

    setIsAdjusting(true);
    try {
      const result = await adjustScoreAction(gradeId, {
        answerId: adjustDialog.answerId,
        newScore,
        reason: adjustReason.trim(),
      });
      if (result.success) {
        toast.success("ปรับคะแนนสำเร็จ");
        setAdjustDialog({ open: false, answerId: "", currentScore: 0, maxScore: 0 });
        queryClient.invalidateQueries({ queryKey: ["grade-detail"] });
        queryClient.invalidateQueries({ queryKey: ["grades"] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsAdjusting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!grade) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <FileText className="h-10 w-10 mb-2" />
        <p className="text-sm">ไม่พบข้อมูลคะแนน</p>
        <Link href="/admin/grading/results">
          <Button variant="link" className="mt-2">
            กลับไปหน้าผลคะแนน
          </Button>
        </Link>
      </div>
    );
  }

  const exam = grade.session.examSchedule.exam;
  const candidate = grade.session.candidate;
  const answers = grade.gradeAnswers;
  const autoCount = answers.filter((a) => a.isAutoGraded).length;
  const manualCount = answers.filter((a) => !a.isAutoGraded).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5"
            onClick={() => router.push("/grading/results")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ผลคะแนน</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {candidate.name || candidate.email} — {exam.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={grade.status} />
          {grade.status === "COMPLETED" && (
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={isPublishing}
              className="gap-1.5"
            >
              {isPublishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              เผยแพร่คะแนน
            </Button>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-sm font-medium">คะแนนรวม</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={grade.totalScore != null && grade.maxScore != null ? getScoreColor(grade.totalScore, grade.maxScore) : ""}>
                {grade.totalScore ?? "—"}
              </span>
              <span className="text-muted-foreground text-lg">/{grade.maxScore ?? "—"}</span>
            </div>
            {grade.percentage != null && (
              <p className="text-sm text-muted-foreground mt-1">
                {Math.round(grade.percentage)}%
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pass/Fail */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-sm font-medium">ผลการสอบ</CardDescription>
          </CardHeader>
          <CardContent>
            {grade.isPassed === true ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">ผ่าน</span>
              </div>
            ) : grade.isPassed === false ? (
              <div className="flex items-center gap-2">
                <XCircle className="h-6 w-6 text-red-600" />
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">ไม่ผ่าน</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-muted-foreground">—</span>
            )}
            {exam.passingScore != null && (
              <p className="text-sm text-muted-foreground mt-1">
                เกณฑ์ผ่าน: {exam.passingScore}%
              </p>
            )}
          </CardContent>
        </Card>

        {/* Candidate */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-sm font-medium">ผู้สอบ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{candidate.name || "—"}</p>
                <p className="text-xs text-muted-foreground">{candidate.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timing */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-sm font-medium">วันที่</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">ตรวจ:</span>
                <span className="font-medium">{formatThaiDate(grade.gradedAt)}</span>
              </div>
              {grade.publishedAt && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Send className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">เผยแพร่:</span>
                  <span className="font-medium">{formatThaiDate(grade.publishedAt)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Answers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            คะแนนรายข้อ ({answers.length} ข้อ)
          </CardTitle>
          <CardDescription>
            ตรวจอัตโนมัติ {autoCount} ข้อ · ตรวจมือ {manualCount} ข้อ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {answers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mb-2" />
              <p className="text-sm">ยังไม่มีข้อมูลคะแนนรายข้อ</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>คำถาม</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead className="text-center">คะแนน</TableHead>
                  <TableHead className="text-center">ตรวจโดย</TableHead>
                  <TableHead className="hidden md:table-cell">Feedback</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {answers.map((ga, idx) => {
                  const question = ga.answer.question;
                  const scoreColor = getScoreColor(ga.score, ga.maxScore);
                  const scoreBg = getScoreBg(ga.score, ga.maxScore);

                  return (
                    <TableRow key={ga.id} className={scoreBg}>
                      <TableCell className="text-center font-medium text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm line-clamp-2 max-w-xs">
                          {question.content}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {QUESTION_TYPE_LABELS[question.type] || question.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn("font-semibold text-sm", scoreColor)}>
                          {ga.score}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          /{ga.maxScore}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {ga.isAutoGraded ? (
                          <Badge
                            variant="secondary"
                            className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 text-xs"
                          >
                            Auto
                          </Badge>
                        ) : ga.gradedBy ? (
                          <span className="text-xs text-muted-foreground">
                            {ga.gradedBy.name || "—"}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {ga.feedback ? (
                          <p className="text-xs text-muted-foreground line-clamp-2 max-w-xs">
                            {ga.feedback}
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {(grade.status === "COMPLETED" || grade.status === "GRADING") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="ปรับคะแนน"
                            onClick={() =>
                              openAdjustDialog(ga.answer.id, ga.score, ga.maxScore)
                            }
                          >
                            <PenLine className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Adjust Score Dialog */}
      <Dialog
        open={adjustDialog.open}
        onOpenChange={(open) => {
          if (!open)
            setAdjustDialog({ open: false, answerId: "", currentScore: 0, maxScore: 0 });
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ปรับคะแนน</DialogTitle>
            <DialogDescription>
              คะแนนปัจจุบัน: {adjustDialog.currentScore}/{adjustDialog.maxScore}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-score">คะแนนใหม่</Label>
              <Input
                id="new-score"
                type="number"
                min={0}
                max={adjustDialog.maxScore}
                step="0.5"
                value={adjustScore}
                onChange={(e) => setAdjustScore(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">เหตุผลในการปรับคะแนน</Label>
              <Textarea
                id="reason"
                placeholder="ระบุเหตุผล..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setAdjustDialog({ open: false, answerId: "", currentScore: 0, maxScore: 0 })
              }
            >
              ยกเลิก
            </Button>
            <Button onClick={handleAdjustScore} disabled={isAdjusting}>
              {isAdjusting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : null}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
