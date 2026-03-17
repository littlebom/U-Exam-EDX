"use client";

import type { JSONContent } from "@tiptap/core";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useSimpleList } from "@/hooks/use-api";
import type { QuestionType } from "./type-selector";
import { TYPE_OPTIONS } from "./type-selector";

// ── Type-specific templates ──
import { MultipleChoiceTemplate } from "./type-templates/multiple-choice";
import type { MCOption } from "./type-templates/multiple-choice";
import { TrueFalseTemplate } from "./type-templates/true-false";
import { ShortAnswerTemplate } from "./type-templates/short-answer";
import { EssayTemplate } from "./type-templates/essay";
import { FillInBlankTemplate } from "./type-templates/fill-in-blank";
import { MatchingTemplate } from "./type-templates/matching";
import type { MatchPair } from "./type-templates/matching";
import { OrderingTemplate } from "./type-templates/ordering";
import { ImageBasedTemplate } from "./type-templates/image-based";

// ── Rich Text Editor ──
import { RichTextEditor } from "@/components/editor";

// ============================================================
// Types
// ============================================================
interface TagItem {
  id: string;
  name: string;
  color: string | null;
}

export interface QuestionFormData {
  content: JSONContent | null;
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  points: number;
  questionGroupId: string;
  tagIds: string[];
  // Type-specific data
  mcOptions: MCOption[];
  correctAnswerId: string;
  trueFalseAnswer: "true" | "false" | "";
  shortAnswers: string[];
  essayRubric: string;
  blanks: string[];
  matchPairs: MatchPair[];
  orderItems: string[];
  imageUrl: string;
}

interface QuestionGroupItem {
  id: string;
  name: string;
  color: string | null;
}

interface QuestionFormProps {
  type: QuestionType;
  data: QuestionFormData;
  onChange: (data: QuestionFormData) => void;
  subjectId?: string;
}

// ============================================================
// Component
// ============================================================
export function QuestionForm({ type, data, onChange, subjectId }: QuestionFormProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const { data: tags } = useSimpleList<TagItem>("tags", "/api/v1/tags");
  const { data: questionGroups } = useSimpleList<QuestionGroupItem>(
    `question-groups-${subjectId}`,
    subjectId ? `/api/v1/subjects/${subjectId}/question-groups` : ""
  );

  const typeOption = TYPE_OPTIONS.find((t) => t.type === type);

  const update = <K extends keyof QuestionFormData>(
    key: K,
    value: QuestionFormData[K]
  ) => {
    onChange({ ...data, [key]: value });
  };

  // ── Render type-specific template ──
  const renderTemplate = () => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return (
          <MultipleChoiceTemplate
            options={data.mcOptions}
            correctAnswerId={data.correctAnswerId}
            onOptionsChange={(opts) => update("mcOptions", opts)}
            onCorrectChange={(id) => update("correctAnswerId", id)}
          />
        );
      case "TRUE_FALSE":
        return (
          <TrueFalseTemplate
            correctAnswer={data.trueFalseAnswer}
            onCorrectChange={(val) => update("trueFalseAnswer", val)}
          />
        );
      case "SHORT_ANSWER":
        return (
          <ShortAnswerTemplate
            answers={data.shortAnswers}
            onAnswersChange={(ans) => update("shortAnswers", ans)}
          />
        );
      case "ESSAY":
        return (
          <EssayTemplate
            rubric={data.essayRubric}
            onRubricChange={(val) => update("essayRubric", val)}
          />
        );
      case "FILL_IN_BLANK":
        return (
          <FillInBlankTemplate
            blanks={data.blanks}
            onBlanksChange={(b) => update("blanks", b)}
          />
        );
      case "MATCHING":
        return (
          <MatchingTemplate
            pairs={data.matchPairs}
            onPairsChange={(p) => update("matchPairs", p)}
          />
        );
      case "ORDERING":
        return (
          <OrderingTemplate
            items={data.orderItems}
            onItemsChange={(items) => update("orderItems", items)}
          />
        );
      case "IMAGE_BASED":
        return (
          <ImageBasedTemplate
            imageUrl={data.imageUrl}
            onImageUrlChange={(url) => update("imageUrl", url)}
            options={data.mcOptions}
            correctAnswerId={data.correctAnswerId}
            onOptionsChange={(opts) => update("mcOptions", opts)}
            onCorrectChange={(id) => update("correctAnswerId", id)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* ─────── Main Editor (2/3) ─────── */}
      <div className="space-y-6 lg:col-span-2">
        {/* Type indicator */}
        {typeOption && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div
              className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${typeOption.color}`}
            >
              <typeOption.icon className="h-3.5 w-3.5" />
            </div>
            <span>ข้อสอบแบบ{typeOption.label}</span>
          </div>
        )}

        {/* Content */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                เนื้อหาคำถาม <span className="text-destructive">*</span>
              </Label>
              <RichTextEditor
                content={data.content}
                onChange={(json) => update("content", json)}
                placeholder="พิมพ์เนื้อหาคำถาม... (ใช้ $...$ สำหรับสูตรคณิตศาสตร์)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Type-specific template */}
        <Card>
          <CardContent className="pt-6">{renderTemplate()}</CardContent>
        </Card>

        {/* Explanation (collapsible) */}
        <Card>
          <CardContent className="pt-6">
            <button
              type="button"
              className="flex w-full items-center justify-between text-sm font-semibold"
              onClick={() => setShowExplanation(!showExplanation)}
            >
              <span>
                เฉลย / คำอธิบาย{" "}
                <span className="font-normal text-muted-foreground">
                  (ไม่บังคับ)
                </span>
              </span>
              {showExplanation ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {showExplanation && (
              <div className="mt-4">
                <Textarea
                  placeholder="อธิบายเหตุผลของคำตอบที่ถูกต้อง เพื่อแสดงให้ผู้สอบเห็นหลังส่งข้อสอบ..."
                  rows={3}
                  value={data.explanation}
                  onChange={(e) => update("explanation", e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─────── Settings Sidebar (1/3) ─────── */}
      <div className="space-y-6 lg:pt-12">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4" />
              ตั้งค่าข้อสอบ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Points */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">คะแนน</Label>
              <Input
                type="number"
                min={0.5}
                max={100}
                step={0.5}
                value={data.points}
                onChange={(e) =>
                  update("points", parseFloat(e.target.value) || 1)
                }
              />
            </div>

            <Separator />

            {/* Difficulty */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">ระดับความยาก</Label>
              <Select
                value={data.difficulty}
                onValueChange={(v) =>
                  update("difficulty", v as "EASY" | "MEDIUM" | "HARD")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      ง่าย
                    </span>
                  </SelectItem>
                  <SelectItem value="MEDIUM">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      ปานกลาง
                    </span>
                  </SelectItem>
                  <SelectItem value="HARD">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      ยาก
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* QuestionGroup (กลุ่มข้อสอบ) */}
            {subjectId && questionGroups && questionGroups.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    กลุ่มข้อสอบ{" "}
                    <span className="font-normal text-muted-foreground">
                      (ไม่บังคับ)
                    </span>
                  </Label>
                  <Select
                    value={data.questionGroupId || "NONE"}
                    onValueChange={(v) =>
                      update("questionGroupId", v === "NONE" ? "" : v)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="เลือกกลุ่มข้อสอบ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">ไม่ระบุ</SelectItem>
                      {questionGroups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          <span className="flex items-center gap-2">
                            {g.color && (
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: g.color }}
                              />
                            )}
                            {g.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Separator />

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                แท็ก{" "}
                <span className="font-normal text-muted-foreground">
                  (ไม่บังคับ)
                </span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {tags?.map((tag) => {
                  const isActive = data.tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted-foreground/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                      onClick={() => {
                        if (isActive) {
                          update(
                            "tagIds",
                            data.tagIds.filter((id) => id !== tag.id)
                          );
                        } else {
                          update("tagIds", [...data.tagIds, tag.id]);
                        }
                      }}
                    >
                      {tag.color && (
                        <span
                          className="mr-1.5 h-2 w-2 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                      )}
                      {tag.name}
                    </button>
                  );
                })}
                {(!tags || tags.length === 0) && (
                  <p className="text-xs text-muted-foreground">
                    ยังไม่มีแท็ก
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// Default form data factory
// ============================================================
export function createDefaultFormData(): QuestionFormData {
  const id1 = crypto.randomUUID().slice(0, 8);
  const id2 = crypto.randomUUID().slice(0, 8);
  const id3 = crypto.randomUUID().slice(0, 8);
  const id4 = crypto.randomUUID().slice(0, 8);

  return {
    content: null,
    explanation: "",
    difficulty: "MEDIUM",
    points: 1,
    questionGroupId: "",
    tagIds: [],
    mcOptions: [
      { id: id1, text: "" },
      { id: id2, text: "" },
      { id: id3, text: "" },
      { id: id4, text: "" },
    ],
    correctAnswerId: "",
    trueFalseAnswer: "",
    shortAnswers: [""],
    essayRubric: "",
    blanks: [""],
    matchPairs: [
      { left: "", right: "" },
      { left: "", right: "" },
      { left: "", right: "" },
    ],
    orderItems: ["", "", ""],
    imageUrl: "",
  };
}
