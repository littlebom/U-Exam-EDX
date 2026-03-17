"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TypeSelector } from "@/components/question-creator/type-selector";
import type { QuestionType } from "@/components/question-creator/type-selector";
import {
  QuestionForm,
  createDefaultFormData,
} from "@/components/question-creator/question-form";
import type { QuestionFormData } from "@/components/question-creator/question-form";
import { isContentEmpty } from "@/lib/content-utils";
import { extractMediaFromContent } from "@/lib/extract-media-from-content";
import { createExamOnlyQuestionAction } from "@/actions/exam.actions";
import { toast } from "sonner";

// ============================================================
// Types
// ============================================================

interface CreateQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  examId: string;
  onCreated: () => void;
}

// ============================================================
// Component
// ============================================================

export function CreateQuestionDialog({
  open,
  onOpenChange,
  sectionId,
  examId,
  onCreated,
}: CreateQuestionDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<QuestionType | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>(
    createDefaultFormData()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeSelect = (type: QuestionType) => {
    setSelectedType(type);
    setFormData(createDefaultFormData());
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedType(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after close animation
    setTimeout(() => {
      setStep(1);
      setSelectedType(null);
      setFormData(createDefaultFormData());
    }, 300);
  };

  const buildPayload = () => {
    if (!selectedType) return null;

    const base = {
      type: selectedType,
      content: formData.content,
      difficulty: formData.difficulty,
      points: formData.points,
      explanation: formData.explanation || null,
      questionGroupId: formData.questionGroupId || null,
      tagIds: formData.tagIds,
      media: extractMediaFromContent(formData.content),
    };

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
            .filter((p) => p.left.trim() && p.right.trim())
            .map((p, idx) => ({ id: String(idx), left: p.left, right: p.right })),
          correctAnswer: formData.matchPairs
            .filter((p) => p.left.trim() && p.right.trim())
            .map((_, idx) => idx),
        };
      case "ORDERING":
        return {
          ...base,
          options: formData.orderItems
            .filter((item) => item.trim())
            .map((item, idx) => ({ id: String(idx), text: item })),
          correctAnswer: formData.orderItems
            .filter((item) => item.trim())
            .map((_, idx) => idx),
        };
      default:
        return base;
    }
  };

  const handleSubmit = async () => {
    if (isContentEmpty(formData.content)) {
      toast.error("กรุณากรอกเนื้อหาคำถาม");
      return;
    }

    const payload = buildPayload();
    if (!payload) return;

    setIsSubmitting(true);
    try {
      const result = await createExamOnlyQuestionAction(
        sectionId,
        examId,
        payload
      );

      if (result.success) {
        toast.success("สร้างข้อสอบและเพิ่มเข้า Section สำเร็จ");
        handleClose();
        onCreated();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent className="sm:max-w-2xl w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>สร้างข้อสอบใหม่</SheetTitle>
          <SheetDescription>
            สร้างข้อสอบใหม่เฉพาะชุดสอบนี้ (จะไม่แสดงในคลังข้อสอบ)
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto min-h-0 py-4">
          {step === 1 ? (
            <TypeSelector
              selected={selectedType}
              onSelect={handleTypeSelect}
            />
          ) : selectedType ? (
            <QuestionForm
              type={selectedType}
              data={formData}
              onChange={setFormData}
            />
          ) : null}
        </div>

        <SheetFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div>
              {step === 2 && (
                <Button variant="ghost" onClick={handleBack}>
                  เปลี่ยนประเภท
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                ยกเลิก
              </Button>
              {step === 2 && (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isContentEmpty(formData.content)}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังสร้าง...
                    </>
                  ) : (
                    "สร้างข้อสอบ"
                  )}
                </Button>
              )}
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
