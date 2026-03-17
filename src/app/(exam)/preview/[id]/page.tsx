"use client";

import { useEffect, useCallback, useState, use } from "react";
import { useRouter } from "next/navigation";
import { extractPlainText } from "@/lib/content-utils";
import { ContentRenderer, OptionTextRenderer } from "@/components/editor";
import {
  ArrowLeft,
  ChevronLeft,
  Check,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Constants ──────────────────────────────────────────────────────

const QUESTION_TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "ปรนัย",
  TRUE_FALSE: "ถูก/ผิด",
  SHORT_ANSWER: "เขียนตอบสั้น",
  ESSAY: "อัตนัย",
  MATCHING: "จับคู่",
  ORDERING: "เรียงลำดับ",
  FILL_IN_BLANK: "เติมคำ",
  IMAGE_BASED: "ดูภาพตอบ",
};

const QUESTION_TYPE_COLORS: Record<string, string> = {
  MULTIPLE_CHOICE:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  TRUE_FALSE:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  SHORT_ANSWER:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  ESSAY:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  MATCHING:
    "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  ORDERING:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  FILL_IN_BLANK:
    "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  IMAGE_BASED:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
};

// ─── Types ──────────────────────────────────────────────────────────

interface PreviewQuestion {
  id: string;
  type: string;
  content: unknown;
  options: unknown;
  correctAnswer: unknown;
  explanation: string | null;
  points: number;
  difficulty: string;
  sectionTitle: string;
}

interface ExamData {
  title: string;
  description: string | null;
  duration: number;
  totalPoints: number;
  passingScore: number;
  status: string;
}

// ─── Page Component ─────────────────────────────────────────────────

export default function ExamPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: examId } = use(params);
  const router = useRouter();

  const [exam, setExam] = useState<ExamData | null>(null);
  const [questions, setQuestions] = useState<PreviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [visited, setVisited] = useState<Set<number>>(new Set([0])); // start with first question visited
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Load Exam Data ──────────────────────────────────────────────

  useEffect(() => {
    async function loadExam() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/v1/exams/${examId}/builder`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "ไม่สามารถโหลดข้อสอบได้");
        }

        const { data } = await res.json();

        setExam({
          title: data.title,
          description: data.description,
          duration: data.duration,
          totalPoints: data.totalPoints,
          passingScore: data.passingScore,
          status: data.status,
        });

        // Flatten sections → questions (same pattern as exam store)
        const flatQuestions: PreviewQuestion[] = [];
        const sections = data.sections ?? [];
        for (const section of sections) {
          const sqs = section.questions ?? [];
          for (const sq of sqs) {
            const q = sq.question;
            flatQuestions.push({
              id: q.id,
              type: q.type,
              content: q.content,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              points: sq.points ?? q.points,
              difficulty: q.difficulty,
              sectionTitle: section.title,
            });
          }
        }

        setQuestions(flatQuestions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setIsLoading(false);
      }
    }

    loadExam();
  }, [examId]);

  // ─── Navigation Helper ─────────────────────────────────────────

  const goToQuestion = useCallback((index: number) => {
    setCurrentIndex(index);
    setVisited((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  // ─── Keyboard Navigation ────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        goToQuestion(currentIndex - 1);
      } else if (e.key === "ArrowRight" && currentIndex < questions.length - 1) {
        goToQuestion(currentIndex + 1);
      }
    },
    [currentIndex, questions.length, goToQuestion]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ─── Helpers ──────────────────────────────────────────────────────

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins} นาที`;
    if (mins === 0) return `${hrs} ชม.`;
    return `${hrs} ชม. ${mins} น.`;
  };

  // ─── Loading / Error States ──────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">กำลังโหลดข้อสอบ...</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              ไม่สามารถโหลดข้อสอบได้
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {error || "ไม่พบข้อมูลข้อสอบ"}
            </p>
            <Button variant="outline" onClick={() => router.back()}>
              กลับ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>ไม่มีข้อสอบ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              ข้อสอบ &quot;{exam.title}&quot; ยังไม่มีคำถาม
            </p>
            <Button variant="outline" onClick={() => router.back()}>
              กลับไปแก้ไข
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="flex h-screen flex-col">
      {/* Preview Banner */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-amber-50 px-4 py-2 dark:bg-amber-950/30">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.close()}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-400">
            <Eye className="h-4 w-4" />
            โหมดดูตัวอย่าง
          </div>
          <span className="hidden text-xs text-amber-600 dark:text-amber-500 sm:inline">
            — มุมมองเดียวกับที่ผู้สอบเห็น (ไม่มีการบันทึกคำตอบ)
          </span>
        </div>

        <Button
          variant={showAnswerKey ? "default" : "outline"}
          size="sm"
          onClick={() => setShowAnswerKey(!showAnswerKey)}
          className={cn(
            "gap-1.5",
            showAnswerKey &&
              "bg-emerald-600 text-white hover:bg-emerald-700"
          )}
        >
          {showAnswerKey ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          {showAnswerKey ? "ซ่อนเฉลย" : "แสดงเฉลย"}
        </Button>
      </div>

      {/* Top Bar — exam info */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 shadow-sm">
        <h1 className="text-sm font-semibold sm:text-base truncate max-w-[400px]">
          {exam.title}
        </h1>

        <div className="flex items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {totalQuestions} ข้อ
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" />
            {exam.totalPoints} คะแนน (ผ่าน {exam.passingScore}%)
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(exam.duration)}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question Area (Left) */}
        <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto w-full max-w-3xl flex-1">
            {/* Question Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  ข้อที่ {currentIndex + 1}/{totalQuestions}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs",
                    QUESTION_TYPE_COLORS[currentQ.type]
                  )}
                >
                  {QUESTION_TYPE_LABELS[currentQ.type] ?? currentQ.type}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {currentQ.points} คะแนน
                </Badge>
                {currentQ.sectionTitle && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    {currentQ.sectionTitle}
                  </Badge>
                )}
              </div>
            </div>

            {/* Question Content */}
            <Card>
              <CardHeader>
                <div className="text-base font-medium leading-relaxed">
                  <ContentRenderer content={currentQ.content} />
                </div>
              </CardHeader>
              <CardContent>
                <QuestionDisplay question={currentQ} />
              </CardContent>
            </Card>

            {/* Answer Key Panel */}
            {showAnswerKey && (
              <AnswerKeyPanel question={currentQ} />
            )}

            {/* Navigation Buttons */}
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => goToQuestion(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                ข้อก่อนหน้า
              </Button>

              <span className="text-sm text-muted-foreground sm:hidden">
                {currentIndex + 1}/{totalQuestions}
              </span>

              <Button
                variant="outline"
                onClick={() => goToQuestion(currentIndex + 1)}
                disabled={currentIndex === totalQuestions - 1}
                className="gap-1.5"
              >
                ข้อถัดไป
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Question Navigation Sidebar (Right) */}
        <div className="hidden w-64 shrink-0 border-l bg-card md:block">
          <div className="flex h-full flex-col">
            <div className="border-b p-4">
              <h2 className="text-sm font-semibold">ผังข้อสอบ</h2>
              {/* Legend */}
              <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-md bg-gradient-to-br from-primary to-primary/70 shadow-sm" />
                  กำลังดู
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-md bg-primary/10 border border-primary/30" />
                  ดูแล้ว
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-md border border-border" />
                  ยังไม่ดู
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="grid grid-cols-5 gap-2.5 p-4">
                {questions.map((q, i) => {
                  const isCurrent = i === currentIndex;
                  const isVisited = visited.has(i);

                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(i)}
                      className={cn(
                        "relative flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition-all duration-200",
                        // Default — ยังไม่ดู
                        "border border-border bg-background text-muted-foreground hover:bg-muted hover:border-muted-foreground/30",
                        // ดูแล้ว
                        isVisited && !isCurrent &&
                          "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15",
                        // กำลังดู
                        isCurrent &&
                          "border-transparent bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md ring-2 ring-primary/20 ring-offset-1 hover:from-primary/90 hover:to-primary/60"
                      )}
                    >
                      {i + 1}
                      {/* Check icon — ดูแล้ว */}
                      {isVisited && !isCurrent && (
                        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            <Separator />

            <div className="p-4 space-y-2.5">
              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">ดูแล้ว</span>
                  <span className="font-semibold text-primary">
                    {visited.size}/{totalQuestions} ข้อ
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300"
                    style={{ width: `${(visited.size / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>
              <Separator />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>คะแนนรวม</span>
                <span className="font-medium text-foreground">
                  {exam.totalPoints} คะแนน
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>เกณฑ์ผ่าน</span>
                <span className="font-medium text-foreground">
                  {exam.passingScore}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Question Display Component (Read-only) ─────────────────────────

function QuestionDisplay({ question }: { question: PreviewQuestion }) {
  switch (question.type) {
    case "MULTIPLE_CHOICE":
    case "IMAGE_BASED": {
      const options = Array.isArray(question.options) ? question.options : [];
      return (
        <RadioGroup disabled className="space-y-3">
          {options.map((opt: { id: string; text: string }) => (
            <div
              key={opt.id}
              className="flex items-center gap-3 rounded-lg border p-4 opacity-80"
            >
              <RadioGroupItem value={opt.id} id={`option-${opt.id}`} disabled />
              <Label
                htmlFor={`option-${opt.id}`}
                className="flex-1 text-sm"
              >
                <OptionTextRenderer text={opt.text} />
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
    }

    case "TRUE_FALSE": {
      const options = Array.isArray(question.options)
        ? question.options
        : [
            { id: "true", text: "ถูก (True)" },
            { id: "false", text: "ผิด (False)" },
          ];
      return (
        <RadioGroup disabled className="space-y-3">
          {options.map((opt: { id: string; text: string }) => (
            <div
              key={opt.id}
              className="flex items-center gap-3 rounded-lg border p-4 opacity-80"
            >
              <RadioGroupItem value={opt.id} id={`option-${opt.id}`} disabled />
              <Label
                htmlFor={`option-${opt.id}`}
                className="flex-1 text-sm"
              >
                <OptionTextRenderer text={opt.text} />
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
    }

    case "SHORT_ANSWER":
      return (
        <div className="space-y-2">
          <Label>คำตอบ</Label>
          <Input
            placeholder="ผู้สอบจะพิมพ์คำตอบที่นี่..."
            disabled
          />
        </div>
      );

    case "ESSAY":
      return (
        <div className="space-y-2">
          <Label>คำตอบ</Label>
          <Textarea
            placeholder="ผู้สอบจะเขียนคำตอบที่นี่..."
            disabled
            rows={8}
            className="resize-y"
          />
        </div>
      );

    case "FILL_IN_BLANK": {
      const questionText = extractPlainText(question.content);
      const blankCount = (questionText.match(/___/g) || []).length || 1;
      return (
        <div className="space-y-3">
          {Array.from({ length: blankCount }, (_, i) => (
            <div key={i} className="space-y-1">
              <Label>ช่องว่างที่ {i + 1}</Label>
              <Input
                placeholder={`ผู้สอบจะเติมคำตอบช่องที่ ${i + 1}...`}
                disabled
              />
            </div>
          ))}
        </div>
      );
    }

    case "MATCHING": {
      const opts = question.options as {
        left: string[];
        right: string[];
      } | null;
      if (!opts) return <p className="text-muted-foreground">ไม่มีตัวเลือก</p>;
      return (
        <div className="space-y-3">
          {opts.left.map((leftItem, i) => (
            <div key={i} className="flex items-center gap-3">
              <Badge variant="outline" className="shrink-0 min-w-[100px] justify-center">
                {leftItem}
              </Badge>
              <span className="text-muted-foreground">=</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm opacity-60"
                disabled
              >
                <option value="">-- เลือก --</option>
                {opts.right.map((rightItem) => (
                  <option key={rightItem} value={rightItem}>
                    {rightItem}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      );
    }

    case "ORDERING": {
      const correctAnswer = question.correctAnswer;
      let items: string[] = [];
      if (
        typeof correctAnswer === "object" &&
        correctAnswer !== null &&
        "order" in correctAnswer
      ) {
        items = (correctAnswer as { order: string[] }).order;
      }

      if (items.length === 0) {
        return (
          <p className="text-muted-foreground text-sm">
            ผู้สอบจะลากเรียงลำดับรายการ
          </p>
        );
      }

      // Shuffle items for preview display (not showing correct order)
      const shuffled = [...items].sort(() => 0.5 - Math.random());
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            ผู้สอบจะลากเพื่อเรียงลำดับ
          </p>
          {shuffled.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg border p-3 opacity-80"
            >
              <Badge variant="outline" className="shrink-0">
                {i + 1}
              </Badge>
              <span className="flex-1 text-sm">{item}</span>
            </div>
          ))}
        </div>
      );
    }

    default:
      return (
        <p className="text-muted-foreground text-sm">
          ประเภทคำถามนี้ยังไม่รองรับการแสดงตัวอย่าง ({question.type})
        </p>
      );
  }
}

// ─── Answer Key Panel ───────────────────────────────────────────────

function AnswerKeyPanel({ question }: { question: PreviewQuestion }) {
  const correctAnswer = question.correctAnswer;

  return (
    <Card className="mt-4 border-emerald-200 dark:border-emerald-900/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          เฉลย
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Correct Answer */}
        <CorrectAnswerDisplay question={question} correctAnswer={correctAnswer} />

        {/* Explanation */}
        {question.explanation && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                คำอธิบาย
              </p>
              <div className="text-sm text-muted-foreground rounded-md bg-muted/50 p-3">
                <ContentRenderer content={question.explanation} />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Correct Answer Display ─────────────────────────────────────────

function CorrectAnswerDisplay({
  question,
  correctAnswer,
}: {
  question: PreviewQuestion;
  correctAnswer: unknown;
}) {
  if (!correctAnswer) {
    return (
      <p className="text-sm text-muted-foreground">ไม่มีข้อมูลเฉลย</p>
    );
  }

  switch (question.type) {
    case "MULTIPLE_CHOICE":
    case "IMAGE_BASED": {
      const options = Array.isArray(question.options) ? question.options : [];
      const answer = correctAnswer as { answerId?: string } | string;
      const correctId = typeof answer === "string" ? answer : answer?.answerId;
      const correctOpt = options.find(
        (o: { id: string; text: string }) => o.id === correctId
      );

      return (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">ตัวเลือกที่ถูกต้อง</p>
          {correctOpt ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm">
                <OptionTextRenderer text={correctOpt.text} />
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              ID: {correctId}
            </p>
          )}
        </div>
      );
    }

    case "TRUE_FALSE": {
      const options = Array.isArray(question.options)
        ? question.options
        : [
            { id: "true", text: "ถูก (True)" },
            { id: "false", text: "ผิด (False)" },
          ];
      const answer = correctAnswer as { answerId?: string } | string;
      const correctId = typeof answer === "string" ? answer : answer?.answerId;
      const correctOpt = options.find(
        (o: { id: string; text: string }) => o.id === correctId
      );

      return (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">คำตอบที่ถูกต้อง</p>
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium">
              {correctOpt?.text ?? correctId}
            </span>
          </div>
        </div>
      );
    }

    case "SHORT_ANSWER": {
      const answer = correctAnswer as
        | { text?: string; acceptedAnswers?: string[] }
        | string;
      const answers: string[] = [];
      if (typeof answer === "string") {
        answers.push(answer);
      } else {
        if (answer.text) answers.push(answer.text);
        if (answer.acceptedAnswers) answers.push(...answer.acceptedAnswers);
      }

      return (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">คำตอบที่ยอมรับ</p>
          <div className="flex flex-wrap gap-2">
            {answers.map((a, i) => (
              <Badge
                key={i}
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
              >
                {a}
              </Badge>
            ))}
          </div>
        </div>
      );
    }

    case "FILL_IN_BLANK": {
      const answer = correctAnswer as { blanks?: string[] } | string[];
      const blanks = Array.isArray(answer) ? answer : answer?.blanks ?? [];

      return (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">เฉลยแต่ละช่อง</p>
          <div className="space-y-1.5">
            {blanks.map((blank, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="shrink-0 text-xs">
                  ช่อง {i + 1}
                </Badge>
                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                  {typeof blank === "string" ? blank : JSON.stringify(blank)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "MATCHING": {
      const answer = correctAnswer as { pairs?: Record<string, string> };
      const pairs = answer?.pairs ?? {};

      return (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">คู่ที่ถูกต้อง</p>
          <div className="space-y-1.5">
            {Object.entries(pairs).map(([left, right]) => (
              <div key={left} className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="shrink-0">
                  {left}
                </Badge>
                <span className="text-muted-foreground">=</span>
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                >
                  {right}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "ORDERING": {
      const answer = correctAnswer as { order?: string[] };
      const order = answer?.order ?? [];

      return (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">ลำดับที่ถูกต้อง</p>
          <div className="space-y-1.5">
            {order.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Badge
                  variant="outline"
                  className="shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                >
                  {i + 1}
                </Badge>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "ESSAY": {
      return (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            ข้อสอบอัตนัย — ตรวจด้วย Rubric / ผู้ตรวจ
          </p>
          <p className="text-sm text-muted-foreground">
            คะแนนเต็ม: {question.points} คะแนน
          </p>
        </div>
      );
    }

    default:
      return (
        <p className="text-sm text-muted-foreground">
          ไม่สามารถแสดงเฉลยสำหรับประเภทนี้ได้
        </p>
      );
  }
}
