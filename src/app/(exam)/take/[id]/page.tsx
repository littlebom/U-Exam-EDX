"use client";

import { useEffect, useCallback, useRef, use } from "react";
import { useState } from "react";
import { extractPlainText } from "@/lib/content-utils";
import { ContentRenderer, OptionTextRenderer } from "@/components/editor";
import { useRouter } from "next/navigation";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Maximize,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useExamStore, type ExamQuestion } from "@/stores/exam-store";
import { toast } from "sonner";

// ─── Constants ──────────────────────────────────────────────────────

const AUTO_SAVE_INTERVAL = 30_000; // 30 seconds
const MAX_VIOLATIONS = 3; // จำนวนครั้งสูงสุดที่อนุญาตให้ออกจากหน้าสอบ

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

// ─── Page Component ─────────────────────────────────────────────────

export default function ExamTakingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: scheduleId } = use(params);
  const router = useRouter();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const violationRef = useRef(0); // ref to avoid stale closure

  const {
    session,
    questions,
    isLoading,
    error,
    currentIndex,
    answers,
    flagged,
    timeRemaining,
    isSubmitting,
    isSubmitted,
    dirtyAnswers,
    setSession,
    setLoading,
    setError,
    setCurrentIndex,
    setAnswer,
    toggleFlag,
    decrementTimer,
    setSubmitting,
    setSubmitted,
    markSaved,
    reset,
  } = useExamStore();

  // ─── Start/Resume Session ──────────────────────────────────────

  useEffect(() => {
    reset();

    async function initSession() {
      try {
        setLoading(true);

        // Start or resume session
        const startRes = await fetch(
          `/api/v1/profile/exam-sessions/${scheduleId}/start`,
          { method: "POST" }
        );

        if (!startRes.ok) {
          const errData = await startRes.json();
          const errMsg =
            typeof errData.error === "string"
              ? errData.error
              : errData.error?.message || "ไม่สามารถเริ่มการสอบได้";
          throw new Error(errMsg);
        }

        const { data: sessionData } = await startRes.json();
        sessionIdRef.current = sessionData.id;
        setSession(sessionData);

        // Load existing answers if resuming
        const answersRes = await fetch(
          `/api/v1/profile/exam-sessions/${sessionData.id}/answers`
        );
        if (answersRes.ok) {
          const { data: existingAnswers } = await answersRes.json();
          if (Array.isArray(existingAnswers)) {
            for (const ans of existingAnswers) {
              if (ans.answer !== null) {
                setAnswer(ans.questionId, ans.answer);
              }
              if (ans.isFlagged) {
                toggleFlag(ans.questionId);
              }
            }
            // Clear dirty since these are already saved
            markSaved();
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "เกิดข้อผิดพลาด"
        );
      }
    }

    initSession();

    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId]);

  // ─── Timer ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!session || isSubmitted) return;

    const timer = setInterval(() => {
      const remaining = decrementTimer();
      if (remaining <= 0) {
        clearInterval(timer);
        handleTimeout();
      }
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isSubmitted]);

  // ─── Auto-save ─────────────────────────────────────────────────

  useEffect(() => {
    if (!session || isSubmitted) return;

    autoSaveRef.current = setInterval(() => {
      performAutoSave();
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isSubmitted]);

  const performAutoSave = useCallback(async () => {
    const { dirtyAnswers, answers, timeRemaining } = useExamStore.getState();
    const sid = sessionIdRef.current;
    if (!sid || Object.keys(dirtyAnswers).length === 0) return;

    try {
      const answersToSave = Object.keys(dirtyAnswers).map((qId) => ({
        questionId: qId,
        answer: answers[qId],
      }));

      const res = await fetch(`/api/v1/profile/exam-sessions/${sid}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: answersToSave,
          timeRemaining,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        // Server detected time expired — force submit
        if (res.status === 403 || json?.error?.code === "TIME_EXPIRED") {
          handleTimeout();
          return;
        }
        throw new Error("Auto-save failed");
      }

      markSaved();
    } catch {
      // Silent fail for auto-save
    }
  }, [markSaved]);

  // ─── Fullscreen Management ─────────────────────────────────────

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      setShowFullscreenPrompt(false);
    } catch {
      // Browser may block fullscreen without user gesture
      setShowFullscreenPrompt(true);
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // ─── Violation Handler (auto-submit when max reached) ─────────

  const handleViolation = useCallback(
    async (type: string) => {
      const sid = sessionIdRef.current;
      if (!sid) return;

      // Log event
      fetch(`/api/v1/profile/exam-sessions/${sid}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      }).catch(() => {});

      // Increment violation count
      const newCount = violationRef.current + 1;
      violationRef.current = newCount;
      setViolationCount(newCount);

      if (newCount >= MAX_VIOLATIONS) {
        // Guard against double-submit
        const { isSubmitting, isSubmitted: alreadySubmitted } = useExamStore.getState();
        if (isSubmitting || alreadySubmitted) return;

        // Terminate exam
        setIsTerminated(true);
        exitFullscreen();
        await performAutoSave();
        try {
          setSubmitting(true);
          await fetch(`/api/v1/profile/exam-sessions/${sid}/submit`, {
            method: "POST",
          });
        } catch {
          // Best effort
        }
        setSubmitted();
      } else {
        // Show warning
        setShowViolationWarning(true);
      }
    },
    [exitFullscreen, performAutoSave, setSubmitted]
  );

  // ─── Anti-cheat Events ─────────────────────────────────────────

  useEffect(() => {
    if (!session || isSubmitted || isTerminated) return;
    const sid = sessionIdRef.current;
    if (!sid) return;

    const logEvent = (type: string) => {
      fetch(`/api/v1/profile/exam-sessions/${sid}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      }).catch(() => {});
    };

    // Tab switch / window blur → violation
    const handleVisibility = () => {
      if (document.hidden) {
        handleViolation("TAB_SWITCH");
      }
    };

    const handleBlur = () => {
      // Only count as violation if not already hidden (avoid double-count)
      if (!document.hidden) {
        handleViolation("BLUR");
      }
    };

    const handleFocus = () => logEvent("FOCUS");

    // Fullscreen exit → violation
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      if (!isNowFullscreen && !isTerminated) {
        handleViolation("FULLSCREEN_EXIT");
      }
    };

    // Block copy/paste/print/context menu
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      logEvent("COPY");
    };
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      logEvent("PASTE");
    };
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+C, Ctrl+V, Ctrl+P, F12
      if (
        (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "p")) ||
        (e.metaKey && (e.key === "c" || e.key === "v" || e.key === "p")) ||
        e.key === "F12"
      ) {
        e.preventDefault();
        logEvent("COPY");
      }
    };

    // Block beforeunload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [session, isSubmitted, isTerminated, handleViolation]);

  // ─── Handlers ──────────────────────────────────────────────────

  const handleTimeout = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid) return;

    exitFullscreen();

    // Save remaining answers before timeout
    await performAutoSave();

    try {
      await fetch(`/api/v1/profile/exam-sessions/${sid}/submit`, {
        method: "POST",
      });
    } catch {
      // Best effort
    }

    setSubmitted();
    toast.error("หมดเวลาสอบ ระบบส่งข้อสอบให้อัตโนมัติ");
  }, [exitFullscreen, performAutoSave, setSubmitted]);

  const handleSubmit = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid) return;

    setSubmitting(true);

    // Save all pending answers first
    await performAutoSave();

    try {
      const res = await fetch(`/api/v1/profile/exam-sessions/${sid}/submit`, {
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "เกิดข้อผิดพลาด");
      }

      exitFullscreen();
      setSubmitted();
      toast.success("ส่งข้อสอบเรียบร้อยแล้ว");
      setShowSubmitDialog(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด"
      );
      setSubmitting(false);
    }
  }, [exitFullscreen, performAutoSave, setSubmitting, setSubmitted]);

  const handleAnswer = useCallback(
    (value: unknown) => {
      if (questions[currentIndex]) {
        setAnswer(questions[currentIndex].id, value);
      }
    },
    [currentIndex, questions, setAnswer]
  );

  const handleFlag = useCallback(() => {
    if (questions[currentIndex]) {
      toggleFlag(questions[currentIndex].id);

      // Persist flag to backend
      const sid = sessionIdRef.current;
      const q = questions[currentIndex];
      if (sid) {
        const isFlagged = !flagged[q.id];
        fetch(`/api/v1/profile/exam-sessions/${sid}/answers`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: q.id,
            isFlagged,
          }),
        }).catch(() => {});
      }
    }
  }, [currentIndex, questions, toggleFlag, flagged]);

  // ─── Derived State ─────────────────────────────────────────────

  const totalQuestions = questions.length;
  const currentQ = questions[currentIndex] ?? null;
  const answeredCount = Object.keys(answers).filter(
    (qId) => answers[qId] !== undefined && answers[qId] !== null && answers[qId] !== ""
  ).length;
  const flaggedCount = flagged.size;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const isTimeLow = timeRemaining < 300;
  const examTitle = session?.examSchedule?.exam?.title ?? "ข้อสอบ";

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // ─── Loading / Error / Submitted States ────────────────────────

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">กำลังเตรียมข้อสอบ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              ไม่สามารถเริ่มสอบได้
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => router.push("/profile/my-exams")}>
              กลับหน้าหลัก
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Terminated State (anti-cheat violation) ───────────────────

  if (isTerminated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Card className="max-w-lg text-center border-destructive">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive text-xl">
              การสอบสิ้นสุดลง
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              การสอบ &quot;{examTitle}&quot; ถูกยุติโดยอัตโนมัติ
              เนื่องจากตรวจพบว่าคุณออกจากหน้าสอบครบ {MAX_VIOLATIONS} ครั้ง
            </p>
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">จำนวนครั้งที่ออกจากหน้าสอบ</span>
                <span className="font-medium text-destructive">{violationCount}/{MAX_VIOLATIONS} ครั้ง</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ข้อที่ตอบแล้ว</span>
                <span className="font-medium">{answeredCount}/{totalQuestions} ข้อ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">สถานะ</span>
                <span className="font-medium text-destructive">ระบบส่งคำตอบอัตโนมัติ</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              คำตอบที่บันทึกไว้ก่อนหน้าจะถูกส่งเข้าสู่ระบบตรวจ
              หากมีข้อสงสัย กรุณาติดต่อผู้จัดสอบ
            </p>
            <Button onClick={() => router.push("/profile/my-exams")} className="w-full">
              กลับหน้าหลัก
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>ส่งข้อสอบเรียบร้อยแล้ว</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              คุณได้ส่งข้อสอบ &quot;{examTitle}&quot; เรียบร้อยแล้ว
            </p>
            <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ตอบแล้ว</span>
                <span className="font-medium">{answeredCount}/{totalQuestions} ข้อ</span>
              </div>
            </div>
            <Button onClick={() => router.push("/profile/my-exams")} className="w-full">
              กลับหน้าหลัก
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQ) return null;

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="flex h-screen flex-col">
      {/* Fullscreen Prompt Overlay */}
      {showFullscreenPrompt && !isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <Card className="max-w-md text-center">
            <CardHeader>
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Maximize className="h-7 w-7 text-primary" />
              </div>
              <CardTitle>เข้าสู่โหมดเต็มหน้าจอ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                ข้อสอบนี้ต้องทำในโหมดเต็มหน้าจอ เพื่อป้องกันการทุจริต
                ระบบจะตรวจจับหากคุณออกจากหน้าสอบ
              </p>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">กฎการสอบ</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• ห้ามสลับ tab หรือเปิดหน้าต่างอื่น</li>
                      <li>• ห้ามออกจากโหมดเต็มหน้าจอ</li>
                      <li>• หากออกจากหน้าสอบครบ {MAX_VIOLATIONS} ครั้ง ระบบจะยุติการสอบทันที</li>
                    </ul>
                  </div>
                </div>
              </div>
              <Button onClick={enterFullscreen} className="w-full" size="lg">
                <Maximize className="h-4 w-4 mr-2" />
                เริ่มสอบ (เต็มหน้าจอ)
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Violation Warning Dialog */}
      {showViolationWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <Card className="max-w-md text-center border-destructive animate-in fade-in zoom-in-95 duration-200">
            <CardHeader>
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <ShieldAlert className="h-7 w-7 text-destructive" />
              </div>
              <CardTitle className="text-destructive">
                คำเตือน! ออกจากหน้าสอบ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                ระบบตรวจพบว่าคุณออกจากหน้าสอบ
              </p>
              <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4">
                <div className="flex items-center justify-center gap-3">
                  {Array.from({ length: MAX_VIOLATIONS }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                        i < violationCount
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {i < violationCount ? <XCircle className="h-5 w-5" /> : i + 1}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm font-medium text-destructive">
                  ครั้งที่ {violationCount} จาก {MAX_VIOLATIONS}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {MAX_VIOLATIONS - violationCount === 0
                    ? "การสอบจะสิ้นสุดลง"
                    : `เหลืออีก ${MAX_VIOLATIONS - violationCount} ครั้ง การสอบจะสิ้นสุดลง`}
                </p>
              </div>
              <Button
                onClick={() => {
                  setShowViolationWarning(false);
                  enterFullscreen();
                }}
                className="w-full"
                variant="destructive"
                size="lg"
              >
                <Maximize className="h-4 w-4 mr-2" />
                กลับเข้าสอบ (เต็มหน้าจอ)
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Violation Counter Badge (always visible in top bar) */}
      {/* Top Bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold sm:text-base truncate max-w-[300px]">
            {examTitle}
          </h1>
          {Object.keys(dirtyAnswers).length > 0 && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              ยังไม่บันทึก
            </Badge>
          )}
          {violationCount > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              <ShieldAlert className="h-3 w-3 mr-1" />
              เตือน {violationCount}/{MAX_VIOLATIONS}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Timer */}
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-mono font-semibold",
              isTimeLow
                ? "bg-destructive/10 text-destructive animate-pulse"
                : "bg-muted text-foreground"
            )}
          >
            <Clock className="h-4 w-4" />
            {formatTime(timeRemaining)}
          </div>

          {/* Progress */}
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm text-muted-foreground">
              {answeredCount}/{totalQuestions} ข้อ
            </span>
            <Progress value={progressPercent} className="w-20" />
          </div>

          {/* Submit Button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowSubmitDialog(true)}
            className="gap-1.5"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">ส่งข้อสอบ</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question Area (Left) */}
        <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto w-full max-w-3xl flex-1">
            {/* Question Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
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
              </div>

              <Button
                variant={flagged[currentQ.id] ? "default" : "outline"}
                size="sm"
                onClick={handleFlag}
                className={cn(
                  "gap-1.5",
                  flagged[currentQ.id] &&
                    "bg-amber-500 text-white hover:bg-amber-600"
                )}
              >
                <Flag className="h-4 w-4" />
                {flagged[currentQ.id] ? "ยกเลิกทำเครื่องหมาย" : "ทำเครื่องหมาย"}
              </Button>
            </div>

            {/* Question Content */}
            <Card>
              <CardHeader>
                <div className="text-base font-medium leading-relaxed">
                  <ContentRenderer content={currentQ.content} />
                </div>
              </CardHeader>
              <CardContent>
                <QuestionInput
                  question={currentQ}
                  value={answers[currentQ.id]}
                  onChange={handleAnswer}
                />
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                ข้อก่อนหน้า
              </Button>

              <span className="text-sm text-muted-foreground sm:hidden">
                {answeredCount}/{totalQuestions} ข้อ
              </span>

              <Button
                variant="outline"
                onClick={() => setCurrentIndex(currentIndex + 1)}
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
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-sm bg-primary" />
                  ตอบแล้ว
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-sm bg-amber-500" />
                  ทำเครื่องหมาย
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-sm border" />
                  ยังไม่ตอบ
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, i) => {
                  const isAnswered =
                    answers[q.id] !== undefined &&
                    answers[q.id] !== null &&
                    answers[q.id] !== "";
                  const isCurrent = i === currentIndex;
                  const isFlagged = flagged[q.id];

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(i)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-md text-xs font-medium transition-all",
                        "border bg-background hover:bg-muted",
                        isAnswered &&
                          "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
                        isFlagged &&
                          "border-amber-500 bg-amber-500 text-white hover:bg-amber-600",
                        isCurrent && "ring-2 ring-ring ring-offset-2"
                      )}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            <Separator />

            <div className="p-4">
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>ตอบแล้ว</span>
                  <span className="font-medium text-foreground">
                    {answeredCount} ข้อ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ทำเครื่องหมาย</span>
                  <span className="font-medium text-foreground">
                    {flaggedCount} ข้อ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ยังไม่ตอบ</span>
                  <span className="font-medium text-foreground">
                    {totalQuestions - answeredCount} ข้อ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              ยืนยันการส่งข้อสอบ
            </DialogTitle>
            <DialogDescription>
              กรุณาตรวจสอบข้อมูลก่อนส่งข้อสอบ เมื่อส่งแล้วจะไม่สามารถแก้ไขได้
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">ตอบแล้ว</span>
              <span className="font-semibold text-foreground">
                {answeredCount}/{totalQuestions} ข้อ
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">ยังไม่ตอบ</span>
              <span
                className={cn(
                  "font-semibold",
                  totalQuestions - answeredCount > 0
                    ? "text-destructive"
                    : "text-foreground"
                )}
              >
                {totalQuestions - answeredCount} ข้อ
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">ทำเครื่องหมาย</span>
              <span
                className={cn(
                  "font-semibold",
                  flaggedCount > 0 ? "text-amber-600" : "text-foreground"
                )}
              >
                {flaggedCount} ข้อ
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">เวลาคงเหลือ</span>
              <span className="font-mono font-semibold text-foreground">
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          {(totalQuestions - answeredCount > 0 || flaggedCount > 0) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {totalQuestions - answeredCount > 0 &&
                    `คุณยังไม่ได้ตอบคำถาม ${totalQuestions - answeredCount} ข้อ`}
                  {totalQuestions - answeredCount > 0 &&
                    flaggedCount > 0 &&
                    " และ "}
                  {flaggedCount > 0 &&
                    `มีคำถามที่ทำเครื่องหมายไว้ ${flaggedCount} ข้อ`}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubmitDialog(false)}
            >
              กลับไปทำข้อสอบ
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังส่ง...
                </>
              ) : (
                "ยืนยันส่งข้อสอบ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────

// getQuestionText removed — using extractPlainText + ContentRenderer from @/lib/content-utils

// ─── Question Input Component ───────────────────────────────────────

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: ExamQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const strValue = typeof value === "string" ? value : "";
  const objValue = typeof value === "object" && value !== null ? value : {};

  switch (question.type) {
    case "MULTIPLE_CHOICE":
    case "IMAGE_BASED": {
      const options = Array.isArray(question.options) ? question.options : [];
      const selectedId =
        typeof objValue === "object" && "answerId" in objValue
          ? (objValue as { answerId: string }).answerId
          : strValue;

      return (
        <RadioGroup
          value={selectedId}
          onValueChange={(v) => onChange({ answerId: v })}
          className="space-y-3"
        >
          {options.map((opt: { id: string; text: string }) => (
            <div
              key={opt.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 transition-colors cursor-pointer hover:bg-muted/50",
                selectedId === opt.id && "border-primary bg-primary/5"
              )}
              onClick={() => onChange({ answerId: opt.id })}
            >
              <RadioGroupItem value={opt.id} id={`option-${opt.id}`} />
              <Label
                htmlFor={`option-${opt.id}`}
                className="flex-1 cursor-pointer text-sm"
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
      const selectedId =
        typeof objValue === "object" && "answerId" in objValue
          ? (objValue as { answerId: string }).answerId
          : strValue;

      return (
        <RadioGroup
          value={selectedId}
          onValueChange={(v) => onChange({ answerId: v })}
          className="space-y-3"
        >
          {options.map((opt: { id: string; text: string }) => (
            <div
              key={opt.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 transition-colors cursor-pointer hover:bg-muted/50",
                selectedId === opt.id && "border-primary bg-primary/5"
              )}
              onClick={() => onChange({ answerId: opt.id })}
            >
              <RadioGroupItem value={opt.id} id={`option-${opt.id}`} />
              <Label
                htmlFor={`option-${opt.id}`}
                className="flex-1 cursor-pointer text-sm"
              >
                <OptionTextRenderer text={opt.text} />
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
    }

    case "SHORT_ANSWER": {
      const textValue =
        typeof objValue === "object" && "text" in objValue
          ? (objValue as { text: string }).text
          : strValue;

      return (
        <div className="space-y-2">
          <Label htmlFor="short-answer">คำตอบ</Label>
          <Input
            id="short-answer"
            placeholder="พิมพ์คำตอบของคุณที่นี่..."
            value={textValue}
            onChange={(e) => onChange({ text: e.target.value })}
          />
        </div>
      );
    }

    case "ESSAY": {
      const textValue =
        typeof objValue === "object" && "text" in objValue
          ? (objValue as { text: string }).text
          : strValue;

      return (
        <div className="space-y-2">
          <Label htmlFor="essay-answer">คำตอบ</Label>
          <Textarea
            id="essay-answer"
            placeholder="เขียนคำตอบของคุณที่นี่..."
            value={textValue}
            onChange={(e) => onChange({ text: e.target.value })}
            rows={8}
            className="resize-y"
          />
        </div>
      );
    }

    case "FILL_IN_BLANK": {
      const blanks =
        typeof objValue === "object" && "blanks" in objValue
          ? (objValue as { blanks: string[] }).blanks
          : [];
      const questionText = extractPlainText(question.content);
      const blankCount = (questionText.match(/___/g) || []).length || 1;

      return (
        <div className="space-y-3">
          {Array.from({ length: blankCount }, (_, i) => (
            <div key={i} className="space-y-1">
              <Label htmlFor={`blank-${i}`}>ช่องว่างที่ {i + 1}</Label>
              <Input
                id={`blank-${i}`}
                placeholder={`เติมคำตอบช่องที่ ${i + 1}...`}
                value={blanks[i] ?? ""}
                onChange={(e) => {
                  const newBlanks = [...blanks];
                  while (newBlanks.length <= i) newBlanks.push("");
                  newBlanks[i] = e.target.value;
                  onChange({ blanks: newBlanks });
                }}
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

      const pairs =
        typeof objValue === "object" && "pairs" in objValue
          ? (objValue as { pairs: Record<string, string> }).pairs
          : ({} as Record<string, string>);

      return (
        <div className="space-y-3">
          {opts.left.map((leftItem, i) => (
            <div key={i} className="flex items-center gap-3">
              <Badge variant="outline" className="shrink-0 min-w-[100px] justify-center">
                {leftItem}
              </Badge>
              <span className="text-muted-foreground">=</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={pairs[leftItem] ?? ""}
                onChange={(e) => {
                  onChange({
                    pairs: { ...pairs, [leftItem]: e.target.value },
                  });
                }}
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
      const orderItems =
        typeof objValue === "object" && "order" in objValue
          ? (objValue as { order: string[] }).order
          : [];

      // Get original items from correct answer structure or content
      const correctAnswer = question.content;
      let availableItems: string[] = [];
      if (
        typeof correctAnswer === "object" &&
        correctAnswer !== null &&
        "order" in correctAnswer
      ) {
        availableItems = (correctAnswer as { order: string[] }).order;
      }

      // If no items provided yet, show empty message
      if (availableItems.length === 0) {
        return (
          <p className="text-muted-foreground text-sm">
            ลากเรียงลำดับรายการ (อยู่ระหว่างพัฒนา)
          </p>
        );
      }

      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            กดปุ่มลูกศรเพื่อเรียงลำดับ
          </p>
          {(orderItems.length > 0 ? orderItems : availableItems).map(
            (item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border p-3"
              >
                <Badge variant="outline" className="shrink-0">
                  {i + 1}
                </Badge>
                <span className="flex-1 text-sm">{item}</span>
              </div>
            )
          )}
        </div>
      );
    }

    default:
      return (
        <p className="text-muted-foreground text-sm">
          ประเภทคำถามนี้ยังไม่รองรับ ({question.type})
        </p>
      );
  }
}
