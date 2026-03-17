"use client";

import { useState, useMemo } from "react";
import { Search, Loader2, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useList, useSimpleList } from "@/hooks/use-api";
import {
  QUESTION_TYPE_LABELS,
  getDifficultyBadge,
  getTypeIcon,
} from "@/lib/question-utils";
import { extractPlainText } from "@/lib/content-utils";
import { addSectionQuestionsAction } from "@/actions/exam.actions";
import { toast } from "sonner";
import type { QuestionType, DifficultyLevel } from "@/types/question-bank";

// ============================================================
// Types
// ============================================================

interface QuestionRow {
  id: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  content: unknown;
  points: number;
  status: string;
  subject: { id: string; code: string; name: string } | null;
  questionGroup: { id: string; name: string; color: string } | null;
  questionTags: Array<{ tag: { id: string; name: string } }>;
}

interface SubjectOption {
  id: string;
  code: string;
  name: string;
}

interface QuestionGroupOption {
  id: string;
  name: string;
}

interface QuestionPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  existingQuestionIds: string[];
  onAdded: () => void;
}

// ============================================================
// Component
// ============================================================

export function QuestionPickerDialog({
  open,
  onOpenChange,
  sectionId,
  existingQuestionIds,
  onAdded,
}: QuestionPickerDialogProps) {
  const [searchText, setSearchText] = useState("");
  const [subjectId, setSubjectId] = useState<string>("all");
  const [questionGroupId, setQuestionGroupId] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load subjects for filter
  const { data: subjects } = useSimpleList<SubjectOption>(
    "subjects",
    "/api/v1/subjects"
  );

  // Load question groups based on selected subject
  const { data: questionGroups } = useSimpleList<QuestionGroupOption>(
    `question-groups-${subjectId}`,
    subjectId !== "all"
      ? `/api/v1/subjects/${subjectId}/question-groups`
      : ""
  );

  // Build query params
  const queryParams: Record<string, string | number | undefined> = {
    search: searchText || undefined,
    status: "ACTIVE",
    subjectId: subjectId !== "all" ? subjectId : undefined,
    questionGroupId: questionGroupId !== "all" ? questionGroupId : undefined,
    type: type !== "all" ? type : undefined,
    difficulty: difficulty !== "all" ? difficulty : undefined,
    perPage: 50,
  };

  const { data, isLoading } = useList<QuestionRow>(
    "question-picker",
    "/api/v1/questions",
    queryParams
  );

  const questions = data?.data ?? [];
  const existingSet = useMemo(
    () => new Set(existingQuestionIds),
    [existingQuestionIds]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;

    setIsSubmitting(true);
    try {
      const result = await addSectionQuestionsAction(sectionId, {
        questionIds: Array.from(selectedIds),
      });

      if (result.success) {
        toast.success(`เพิ่ม ${result.data?.added ?? 0} ข้อสอบสำเร็จ`);
        setSelectedIds(new Set());
        onOpenChange(false);
        onAdded();
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>เลือกข้อสอบจากคลัง</SheetTitle>
          <SheetDescription>
            เลือกข้อสอบที่ต้องการเพิ่มเข้า Section
          </SheetDescription>
        </SheetHeader>

        {/* Filters */}
        <div className="space-y-3 py-4 border-b">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาข้อสอบ..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Subject */}
            <div className="space-y-1">
              <Label className="text-xs">วิชา</Label>
              <Select
                value={subjectId}
                onValueChange={(v) => {
                  setSubjectId(v);
                  setQuestionGroupId("all");
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {(subjects ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Question Group */}
            <div className="space-y-1">
              <Label className="text-xs">กลุ่มข้อสอบ</Label>
              <Select
                value={questionGroupId}
                onValueChange={setQuestionGroupId}
                disabled={subjectId === "all"}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {(questionGroups ?? []).map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-1">
              <Label className="text-xs">ประเภท</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty */}
            <div className="space-y-1">
              <Label className="text-xs">ระดับ</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="EASY">ง่าย</SelectItem>
                  <SelectItem value="MEDIUM">ปานกลาง</SelectItem>
                  <SelectItem value="HARD">ยาก</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : questions.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              ไม่พบข้อสอบที่ตรงเงื่อนไข
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]" />
                  <TableHead>คำถาม</TableHead>
                  <TableHead className="w-[80px]">ประเภท</TableHead>
                  <TableHead className="w-[80px]">ระดับ</TableHead>
                  <TableHead className="w-[60px] text-center">
                    คะแนน
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((q) => {
                  const isExisting = existingSet.has(q.id);
                  const isSelected = selectedIds.has(q.id);
                  const preview = extractPlainText(q.content).trim();
                  const truncated =
                    preview.length > 60
                      ? preview.slice(0, 60) + "..."
                      : preview;

                  return (
                    <TableRow
                      key={q.id}
                      className={
                        isExisting
                          ? "opacity-50"
                          : isSelected
                            ? "bg-primary/5"
                            : "cursor-pointer hover:bg-muted/50"
                      }
                      onClick={() => !isExisting && toggleSelect(q.id)}
                    >
                      <TableCell>
                        {isExisting ? (
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(q.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1.5">
                          <span className="text-muted-foreground mt-0.5">
                            {getTypeIcon(q.type)}
                          </span>
                          <div>
                            <span className="text-sm">
                              {truncated || "ไม่มีเนื้อหา"}
                            </span>
                            {isExisting && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (เพิ่มแล้ว)
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {QUESTION_TYPE_LABELS[q.type] ?? q.type}
                        </span>
                      </TableCell>
                      <TableCell>{getDifficultyBadge(q.difficulty)}</TableCell>
                      <TableCell className="text-center text-sm">
                        {q.points}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Footer */}
        <SheetFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">
              เลือกแล้ว: {selectedIds.size} ข้อ
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                ยกเลิก
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || selectedIds.size === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังเพิ่ม...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    เพิ่มข้อสอบ ({selectedIds.size} ข้อ)
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
