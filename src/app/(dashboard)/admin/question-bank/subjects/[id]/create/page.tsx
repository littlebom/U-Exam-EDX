"use client";

import { useState } from "react";
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
import { createQuestionAction } from "@/actions/question.actions";
import { toast } from "sonner";
import { isContentEmpty } from "@/lib/content-utils";
import { extractMediaFromContent } from "@/lib/extract-media-from-content";

import { TypeSelector } from "@/components/question-creator/type-selector";
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

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: "เลือกประเภท",
  2: "กรอกข้อมูล",
  3: "ตรวจสอบ",
};

// ============================================================
// Page Component
// ============================================================
export default function CreateQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;

  const { data: subject, isLoading } = useDetail<SubjectDetail>(
    `subject-${subjectId}`,
    `/api/v1/subjects/${subjectId}`
  );

  const [step, setStep] = useState<Step>(1);
  const [selectedType, setSelectedType] = useState<QuestionType | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>(
    createDefaultFormData()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Step navigation ──
  const canGoNext = () => {
    switch (step) {
      case 1:
        return selectedType !== null;
      case 2:
        return !isContentEmpty(formData.content);
      case 3:
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (step < 3 && canGoNext()) {
      setStep((step + 1) as Step);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  // ── Build payload for submission ──
  const buildPayload = (status: "DRAFT" | "ACTIVE") => {
    if (!selectedType) return null;

    const base = {
      type: selectedType,
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

    // Add type-specific data
    switch (selectedType) {
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
            selectedType === "IMAGE_BASED"
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
      const result = await createQuestionAction(payload);

      if (result.success) {
        toast.success(
          status === "DRAFT"
            ? "บันทึกแบบร่างสำเร็จ"
            : "สร้างและเผยแพร่ข้อสอบสำเร็จ"
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
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="mb-1 text-lg font-medium">ไม่พบวิชา</h3>
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
        <span className="text-foreground font-medium">สร้างข้อสอบ</span>
      </nav>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">สร้างข้อสอบใหม่</h1>
        <p className="text-sm text-muted-foreground">
          วิชา {subject.name} ({subject.code})
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-3">
        {([1, 2, 3] as Step[]).map((s) => (
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
            {s < 3 && (
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
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              เลือกประเภทข้อสอบที่ต้องการสร้าง
            </p>
            <TypeSelector
              selected={selectedType}
              onSelect={setSelectedType}
            />
          </div>
        )}

        {step === 2 && selectedType && (
          <QuestionForm
            type={selectedType}
            data={formData}
            onChange={setFormData}
            subjectId={subjectId}
          />
        )}

        {step === 3 && selectedType && (
          <QuestionPreview type={selectedType} data={formData} />
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
          {step < 3 ? (
            <Button
              type="button"
              className="gap-1.5"
              disabled={!canGoNext()}
              onClick={goNext}
            >
              ถัดไป
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
