"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  CheckCircle,
  X,
  ArrowRight,
  Video,
  Music,
} from "lucide-react";
import type { QuestionType } from "./type-selector";
import { TYPE_OPTIONS } from "./type-selector";
import type { QuestionFormData } from "./question-form";
import { ContentRenderer, OptionTextRenderer } from "@/components/editor";
import { isContentEmpty } from "@/lib/content-utils";
import { formatDuration } from "@/lib/media-utils";

// ============================================================
// Constants
// ============================================================
const LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const DIFFICULTY_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  EASY: {
    label: "ง่าย",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  MEDIUM: {
    label: "ปานกลาง",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  HARD: {
    label: "ยาก",
    className:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

// ============================================================
// Component
// ============================================================
interface QuestionPreviewProps {
  type: QuestionType;
  data: QuestionFormData;
}

export function QuestionPreview({ type, data }: QuestionPreviewProps) {
  const typeOption = TYPE_OPTIONS.find((t) => t.type === type);
  const diffConfig = DIFFICULTY_CONFIG[data.difficulty];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Preview Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Eye className="h-4 w-4" />
        <span>ตัวอย่างข้อสอบ — ตามที่ผู้สอบจะเห็น</span>
      </div>

      {/* Question Card */}
      <Card className="overflow-hidden">
        {/* Type & difficulty bar */}
        <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-3">
          <div className="flex items-center gap-2">
            {typeOption && (
              <Badge variant="secondary" className="gap-1">
                <typeOption.icon className="h-3 w-3" />
                {typeOption.label}
              </Badge>
            )}
            {diffConfig && (
              <Badge variant="secondary" className={diffConfig.className}>
                {diffConfig.label}
              </Badge>
            )}
          </div>
          <span className="text-sm font-semibold">
            {data.points} คะแนน
          </span>
        </div>

        <CardContent className="space-y-5 pt-6">
          {/* Content */}
          {!isContentEmpty(data.content) ? (
            <div className="text-base font-medium">
              <ContentRenderer content={data.content} />
            </div>
          ) : (
            <p className="italic text-muted-foreground">
              (ยังไม่ได้ระบุเนื้อหาคำถาม)
            </p>
          )}

          {/* Image for IMAGE_BASED */}
          {type === "IMAGE_BASED" && data.imageUrl && (
            <div className="overflow-hidden rounded-lg border bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.imageUrl}
                alt="Question"
                className="max-h-64 w-full object-contain"
              />
            </div>
          )}

          <Separator />

          {/* Type-specific preview */}
          {renderTypePreview(type, data)}
        </CardContent>
      </Card>

      {/* Explanation Card */}
      {data.explanation && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              เฉลย / คำอธิบาย
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">
              {data.explanation}
            </p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

// ============================================================
// Type-specific preview renderers
// ============================================================
function renderTypePreview(type: QuestionType, data: QuestionFormData) {
  switch (type) {
    case "MULTIPLE_CHOICE":
    case "IMAGE_BASED":
      return renderMCPreview(data);
    case "TRUE_FALSE":
      return renderTrueFalsePreview(data);
    case "SHORT_ANSWER":
      return renderShortAnswerPreview(data);
    case "ESSAY":
      return renderEssayPreview(data);
    case "FILL_IN_BLANK":
      return renderFillInBlankPreview(data);
    case "MATCHING":
      return renderMatchingPreview(data);
    case "ORDERING":
      return renderOrderingPreview(data);
    default:
      return null;
  }
}

function renderMCPreview(data: QuestionFormData) {
  const filledOptions = data.mcOptions.filter((o) => o.text.trim() || o.media);
  if (filledOptions.length === 0) {
    return (
      <p className="text-sm italic text-muted-foreground">
        ยังไม่ได้เพิ่มตัวเลือก
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {filledOptions.map((opt, idx) => {
        const isCorrect = opt.id === data.correctAnswerId;
        return (
          <div
            key={opt.id}
            className={`flex items-center gap-3 rounded-lg border p-3 ${
              isCorrect
                ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                : ""
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold">
              {LABELS[idx]}
            </span>

            {/* Option media */}
            {opt.media && (
              <>
                {opt.media.type === "IMAGE" ? (
                  <div className="shrink-0 overflow-hidden rounded-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={opt.media.thumbnailUrl || opt.media.url}
                      alt={opt.media.filename}
                      className="h-10 w-10 object-cover"
                    />
                  </div>
                ) : opt.media.type === "VIDEO" ? (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Video
                      className={`h-4 w-4 ${
                        opt.media.provider === "youtube"
                          ? "text-red-600"
                          : "text-blue-600"
                      }`}
                    />
                  </div>
                ) : (
                  <div className="flex h-10 shrink-0 items-center gap-1 rounded-md bg-muted px-2">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    {opt.media.duration != null && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatDuration(opt.media.duration)}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}

            <span className="flex-1 text-sm"><OptionTextRenderer text={opt.text} /></span>
            {isCorrect && (
              <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderTrueFalsePreview(data: QuestionFormData) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div
        className={`flex items-center justify-center gap-2 rounded-lg border-2 p-4 ${
          data.trueFalseAnswer === "true"
            ? "border-green-400 bg-green-50 dark:bg-green-950/20"
            : ""
        }`}
      >
        <CheckCircle
          className={`h-5 w-5 ${
            data.trueFalseAnswer === "true"
              ? "text-green-600"
              : "text-muted-foreground"
          }`}
        />
        <span className="font-medium">ถูก</span>
      </div>
      <div
        className={`flex items-center justify-center gap-2 rounded-lg border-2 p-4 ${
          data.trueFalseAnswer === "false"
            ? "border-red-400 bg-red-50 dark:bg-red-950/20"
            : ""
        }`}
      >
        <X
          className={`h-5 w-5 ${
            data.trueFalseAnswer === "false"
              ? "text-red-600"
              : "text-muted-foreground"
          }`}
        />
        <span className="font-medium">ผิด</span>
      </div>
    </div>
  );
}

function renderShortAnswerPreview(data: QuestionFormData) {
  const filledAnswers = data.shortAnswers.filter((a) => a.trim());
  return (
    <div className="space-y-3">
      <div className="rounded-lg border-2 border-dashed p-4">
        <p className="text-sm text-muted-foreground">
          ช่องพิมพ์คำตอบของผู้สอบ
        </p>
      </div>
      {filledAnswers.length > 0 && (
        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/20">
          <p className="mb-1 text-xs font-medium text-green-700 dark:text-green-400">
            คำตอบที่ยอมรับ:
          </p>
          <p className="text-sm">
            {filledAnswers.join(" / ")}
          </p>
        </div>
      )}
    </div>
  );
}

function renderEssayPreview(data: QuestionFormData) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border-2 border-dashed p-6">
        <p className="text-sm text-muted-foreground">
          พื้นที่เขียนคำตอบ (เรียงความ)
        </p>
      </div>
      {data.essayRubric && (
        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
          <p className="mb-1 text-xs font-medium text-blue-700 dark:text-blue-400">
            เกณฑ์ตรวจ:
          </p>
          <p className="whitespace-pre-wrap text-sm">{data.essayRubric}</p>
        </div>
      )}
    </div>
  );
}

function renderFillInBlankPreview(data: QuestionFormData) {
  const filledBlanks = data.blanks.filter((b) => b.trim());
  return (
    <div className="space-y-3">
      {filledBlanks.length > 0 ? (
        <div className="space-y-2">
          {filledBlanks.map((blank, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-lg bg-green-50 p-3 dark:bg-green-950/20"
            >
              <span className="flex h-6 shrink-0 items-center justify-center rounded bg-green-200 px-2 text-xs font-bold dark:bg-green-800">
                ช่อง {idx + 1}
              </span>
              <span className="text-sm">{blank}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm italic text-muted-foreground">
          ยังไม่ได้ระบุคำตอบ
        </p>
      )}
    </div>
  );
}

function renderMatchingPreview(data: QuestionFormData) {
  const filledPairs = data.matchPairs.filter(
    (p) => p.left.trim() || p.right.trim()
  );
  if (filledPairs.length === 0) {
    return (
      <p className="text-sm italic text-muted-foreground">
        ยังไม่ได้เพิ่มคู่จับคู่
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {filledPairs.map((pair, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 rounded-lg border p-3"
        >
          <span className="flex-1 text-sm font-medium">
            {pair.left || "—"}
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-sm">{pair.right || "—"}</span>
        </div>
      ))}
    </div>
  );
}

function renderOrderingPreview(data: QuestionFormData) {
  const filledItems = data.orderItems.filter((i) => i.trim());
  if (filledItems.length === 0) {
    return (
      <p className="text-sm italic text-muted-foreground">
        ยังไม่ได้เพิ่มรายการ
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {filledItems.map((item, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 rounded-lg border p-3"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {idx + 1}
          </span>
          <span className="flex-1 text-sm">{item}</span>
        </div>
      ))}
    </div>
  );
}
