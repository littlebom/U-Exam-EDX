"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  Save,
  Send,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDetail } from "@/hooks/use-api";
import { updateQuestionAction } from "@/actions/question.actions";
import { toast } from "sonner";
import { legacyToTiptap, isContentEmpty } from "@/lib/content-utils";
import { extractMediaFromContent } from "@/lib/extract-media-from-content";

import type { QuestionType } from "@/components/question-creator/type-selector";
import {
  QuestionForm,
  createDefaultFormData,
} from "@/components/question-creator/question-form";
import type { QuestionFormData } from "@/components/question-creator/question-form";
import { QuestionPreview } from "@/components/question-creator/question-preview";

// ============================================================
// Types
// ============================================================
interface SubjectDetail {
  id: string;
  code: string;
  name: string;
}

interface QuestionMediaDetail {
  mediaFile: {
    id: string;
    url: string;
    thumbnailUrl: string | null;
    type: "IMAGE" | "AUDIO" | "VIDEO";
    filename: string;
    mimeType: string;
    duration: number | null;
    provider: string | null;
    externalId: string | null;
  };
  caption: string | null;
  sortOrder: number;
}

interface QuestionDetail {
  id: string;
  type: QuestionType;
  content: unknown;
  options: unknown;
  correctAnswer: unknown;
  explanation: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  points: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  subjectId: string | null;
  questionGroupId: string | null;
  metadata: unknown;
  questionTags: { tag: { id: string; name: string } }[];
  media?: QuestionMediaDetail[];
}

type Step = 1 | 2;

const STEP_LABELS: Record<Step, string> = {
  1: "แก้ไขข้อมูล",
  2: "ตรวจสอบ",
};

// ============================================================
// Helper: Convert API question data → QuestionFormData
// ============================================================
function questionToFormData(q: QuestionDetail): QuestionFormData {
  const base = createDefaultFormData();

  // Common fields
  base.content = legacyToTiptap(q.content);
  base.explanation = q.explanation || "";
  base.difficulty = q.difficulty || "MEDIUM";
  base.points = q.points ?? 1;
  base.questionGroupId = q.questionGroupId || "";
  base.tagIds = q.questionTags?.map((qt) => qt.tag.id) ?? [];

  // Media is now embedded in content JSON (no separate media array)

  // Type-specific fields
  switch (q.type) {
    case "MULTIPLE_CHOICE":
    case "IMAGE_BASED": {
      const opts = parseOptions(q.options);
      base.mcOptions = opts.length > 0 ? opts : base.mcOptions;
      base.correctAnswerId =
        typeof q.correctAnswer === "string" ? q.correctAnswer : "";
      if (q.type === "IMAGE_BASED") {
        const meta = q.metadata as { imageUrl?: string } | null;
        base.imageUrl = meta?.imageUrl || "";
      }
      break;
    }
    case "TRUE_FALSE": {
      const answer = typeof q.correctAnswer === "string" ? q.correctAnswer : "";
      base.trueFalseAnswer =
        answer === "true" || answer === "false" ? answer : "";
      break;
    }
    case "SHORT_ANSWER": {
      const answers = Array.isArray(q.correctAnswer)
        ? (q.correctAnswer as string[])
        : [];
      base.shortAnswers = answers.length > 0 ? answers : [""];
      break;
    }
    case "ESSAY": {
      const meta = q.metadata as { rubric?: string } | null;
      base.essayRubric = meta?.rubric || "";
      break;
    }
    case "FILL_IN_BLANK": {
      const blanks = Array.isArray(q.correctAnswer)
        ? (q.correctAnswer as string[])
        : [];
      base.blanks = blanks.length > 0 ? blanks : [""];
      break;
    }
    case "MATCHING": {
      const pairs = parseMatchPairs(q.options, q.correctAnswer);
      base.matchPairs =
        pairs.length > 0
          ? pairs
          : [
              { left: "", right: "" },
              { left: "", right: "" },
            ];
      break;
    }
    case "ORDERING": {
      const items = parseOrderItems(q.options);
      base.orderItems = items.length > 0 ? items : ["", ""];
      break;
    }
  }

  return base;
}

function parseOptions(
  options: unknown
): { id: string; text: string; media?: { mediaFileId: string; url: string; thumbnailUrl?: string | null; type: "IMAGE" | "AUDIO" | "VIDEO"; filename: string; mimeType: string; duration?: number | null; provider?: string | null; externalId?: string | null } | null }[] {
  if (!Array.isArray(options)) return [];
  return options
    .filter(
      (o): o is { id: string; text: string; media?: unknown } =>
        typeof o === "object" && o !== null && "id" in o && "text" in o
    )
    .map((o) => {
      const base: { id: string; text: string; media?: { mediaFileId: string; url: string; thumbnailUrl?: string | null; type: "IMAGE" | "AUDIO" | "VIDEO"; filename: string; mimeType: string; duration?: number | null; provider?: string | null; externalId?: string | null } | null } = {
        id: String(o.id),
        text: String(o.text),
      };
      // Parse option media if present
      if (
        o.media &&
        typeof o.media === "object" &&
        "mediaFileId" in (o.media as Record<string, unknown>) &&
        "url" in (o.media as Record<string, unknown>)
      ) {
        const m = o.media as Record<string, unknown>;
        base.media = {
          mediaFileId: String(m.mediaFileId),
          url: String(m.url),
          thumbnailUrl: m.thumbnailUrl ? String(m.thumbnailUrl) : null,
          type: String(m.type) as "IMAGE" | "AUDIO" | "VIDEO",
          filename: String(m.filename || ""),
          mimeType: String(m.mimeType || ""),
          duration: typeof m.duration === "number" ? m.duration : null,
          provider: m.provider ? String(m.provider) : null,
          externalId: m.externalId ? String(m.externalId) : null,
        };
      }
      return base;
    });
}

function parseMatchPairs(
  options: unknown,
  correctAnswer: unknown
): { left: string; right: string }[] {
  // Try correctAnswer first (it stores left-right pairs)
  if (Array.isArray(correctAnswer)) {
    return correctAnswer
      .filter(
        (p): p is { left: string; right: string } =>
          typeof p === "object" && p !== null && "left" in p && "right" in p
      )
      .map((p) => ({ left: String(p.left), right: String(p.right) }));
  }
  // Fallback to options
  if (Array.isArray(options)) {
    return options
      .filter(
        (p): p is { left: string; right: string } =>
          typeof p === "object" && p !== null && "left" in p && "right" in p
      )
      .map((p) => ({ left: String(p.left), right: String(p.right) }));
  }
  return [];
}

function parseOrderItems(options: unknown): string[] {
  if (!Array.isArray(options)) return [];
  return options
    .filter(
      (o): o is { text: string } =>
        typeof o === "object" && o !== null && "text" in o
    )
    .sort((a, b) => {
      const orderA = "order" in a ? Number(a.order) : 0;
      const orderB = "order" in b ? Number(b.order) : 0;
      return orderA - orderB;
    })
    .map((o) => String(o.text));
}

// ============================================================
// Page Component
// ============================================================
export default function EditQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;
  const questionId = params.questionId as string;

  const { data: subject, isLoading: subjectLoading } =
    useDetail<SubjectDetail>(
      `subject-${subjectId}`,
      `/api/v1/subjects/${subjectId}`
    );

  const { data: question, isLoading: questionLoading } =
    useDetail<QuestionDetail>(
      `question-${questionId}`,
      `/api/v1/questions/${questionId}`
    );

  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<QuestionFormData>(
    createDefaultFormData()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Populate form when question data loads
  useEffect(() => {
    if (question && !initialized) {
      setFormData(questionToFormData(question));
      setInitialized(true);
    }
  }, [question, initialized]);

  const questionType: QuestionType | null = question?.type ?? null;

  // ── Step navigation ──
  const canGoNext = () => {
    switch (step) {
      case 1:
        return !isContentEmpty(formData.content);
      case 2:
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (step < 2 && canGoNext()) {
      setStep(2);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(1);
    }
  };

  // ── Build payload for submission ──
  const buildPayload = (status: "DRAFT" | "ACTIVE") => {
    if (!questionType) return null;

    const base = {
      id: questionId,
      type: questionType,
      content: formData.content,
      difficulty: formData.difficulty,
      points: formData.points,
      status,
      subjectId,
      explanation: formData.explanation || null,
      questionGroupId: formData.questionGroupId || null,
      tagIds: formData.tagIds,
      media: extractMediaFromContent(formData.content),
    };

    switch (questionType) {
      case "MULTIPLE_CHOICE":
      case "IMAGE_BASED": {
        const options = formData.mcOptions
          .filter((o) => o.text.trim() || o.media)
          .map((o, idx) => ({
            id: o.id,
            text: o.text,
            order: idx,
            media: o.media
              ? {
                  mediaFileId: o.media.mediaFileId,
                  url: o.media.url,
                  thumbnailUrl: o.media.thumbnailUrl,
                  type: o.media.type,
                  filename: o.media.filename,
                  mimeType: o.media.mimeType,
                  duration: o.media.duration,
                  provider: o.media.provider,
                  externalId: o.media.externalId,
                }
              : null,
          }));
        return {
          ...base,
          options,
          correctAnswer: formData.correctAnswerId,
          metadata:
            questionType === "IMAGE_BASED"
              ? { imageUrl: formData.imageUrl }
              : null,
        };
      }
      case "TRUE_FALSE":
        return {
          ...base,
          options: [
            { id: "true", text: "ถูก" },
            { id: "false", text: "ผิด" },
          ],
          correctAnswer: formData.trueFalseAnswer,
        };
      case "SHORT_ANSWER":
        return {
          ...base,
          correctAnswer: formData.shortAnswers.filter((a) => a.trim()),
        };
      case "ESSAY":
        return {
          ...base,
          metadata: { rubric: formData.essayRubric },
        };
      case "FILL_IN_BLANK":
        return {
          ...base,
          correctAnswer: formData.blanks.filter((b) => b.trim()),
        };
      case "MATCHING":
        return {
          ...base,
          options: formData.matchPairs
            .filter((p) => p.left.trim() || p.right.trim())
            .map((p, idx) => ({
              id: `pair-${idx}`,
              left: p.left,
              right: p.right,
            })),
          correctAnswer: formData.matchPairs
            .filter((p) => p.left.trim() && p.right.trim())
            .map((p) => ({ left: p.left, right: p.right })),
        };
      case "ORDERING":
        return {
          ...base,
          options: formData.orderItems
            .filter((i) => i.trim())
            .map((text, idx) => ({ id: `item-${idx}`, text, order: idx })),
          correctAnswer: formData.orderItems
            .filter((i) => i.trim())
            .map((text, idx) => ({ text, order: idx })),
        };
      default:
        return base;
    }
  };

  // ── Submit handler ──
  const handleSubmit = async (status: "DRAFT" | "ACTIVE") => {
    const payload = buildPayload(status);
    if (!payload) return;

    setIsSubmitting(true);
    try {
      const result = await updateQuestionAction(payload);

      if (result.success) {
        toast.success(
          status === "DRAFT"
            ? "บันทึกแบบร่างสำเร็จ"
            : "บันทึกและเผยแพร่สำเร็จ"
        );
        router.push(`/question-bank/subjects/${subjectId}`);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading / Error ──
  if (subjectLoading || questionLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subject || !question) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="mb-1 text-lg font-medium">ไม่พบข้อมูล</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          ข้อสอบหรือวิชานี้อาจถูกลบไปแล้ว
        </p>
        <Link href="/admin/question-bank">
          <Button variant="outline">กลับหน้าคลังข้อสอบ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/admin/question-bank"
          className="hover:text-foreground transition-colors"
        >
          คลังข้อสอบ
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/question-bank/subjects/${subjectId}`}
          className="hover:text-foreground transition-colors"
        >
          {subject.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">แก้ไขข้อสอบ</span>
      </nav>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">แก้ไขข้อสอบ</h1>
        <p className="text-sm text-muted-foreground">
          วิชา {subject.name} ({subject.code})
        </p>
      </div>

      {/* Stepper (2 steps for edit: edit → preview) */}
      <div className="flex items-center gap-3">
        {([1, 2] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : step > s
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            <span
              className={`text-sm ${
                step === s ? "font-semibold" : "text-muted-foreground"
              }`}
            >
              {STEP_LABELS[s]}
            </span>
            {s < 2 && (
              <div
                className={`h-px w-8 sm:w-16 ${
                  step > s ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {step === 1 && questionType && initialized && (
          <QuestionForm
            type={questionType}
            data={formData}
            onChange={setFormData}
            subjectId={subjectId}
          />
        )}

        {step === 2 && questionType && (
          <QuestionPreview type={questionType} data={formData} />
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between border-t pt-6">
        <div>
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              className="gap-1.5"
              onClick={goBack}
            >
              <ChevronLeft className="h-4 w-4" />
              ย้อนกลับ
            </Button>
          ) : (
            <Button variant="ghost" asChild>
              <Link href={`/question-bank/subjects/${subjectId}`}>
                ยกเลิก
              </Link>
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {step < 2 ? (
            <Button
              type="button"
              className="gap-1.5"
              disabled={!canGoNext()}
              onClick={goNext}
            >
              ตรวจสอบ
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                disabled={isSubmitting}
                onClick={() => handleSubmit("DRAFT")}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                บันทึกแบบร่าง
              </Button>
              <Button
                type="button"
                className="gap-1.5"
                disabled={isSubmitting}
                onClick={() => handleSubmit("ACTIVE")}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                บันทึกและเผยแพร่
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
