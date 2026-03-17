"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSimpleList } from "@/hooks/use-api";
import {
  generateFromBlueprintsAction,
  simpleRandomAction,
} from "@/actions/exam.actions";
import { toast } from "sonner";

// ============================================================
// Types
// ============================================================

interface SubjectOption {
  id: string;
  code: string;
  name: string;
}

interface QuestionGroupOption {
  id: string;
  name: string;
}

interface BlueprintRule {
  difficulty: string;
  count: number;
  points: number;
}

interface BlueprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  onGenerated: () => void;
}

// ============================================================
// Component
// ============================================================

export function BlueprintDialog({
  open,
  onOpenChange,
  sectionId,
  onGenerated,
}: BlueprintDialogProps) {
  const [tab, setTab] = useState("blueprint");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shared filters
  const [subjectId, setSubjectId] = useState<string>("all");
  const [questionGroupId, setQuestionGroupId] = useState<string>("all");

  // Blueprint mode state
  const [rules, setRules] = useState<BlueprintRule[]>([
    { difficulty: "EASY", count: 5, points: 1 },
    { difficulty: "MEDIUM", count: 3, points: 2 },
    { difficulty: "HARD", count: 2, points: 3 },
  ]);

  // Simple random mode state
  const [simpleCount, setSimpleCount] = useState(10);
  const [simplePoints, setSimplePoints] = useState(1);

  // Load subjects
  const { data: subjects } = useSimpleList<SubjectOption>(
    "subjects",
    "/api/v1/subjects"
  );

  // Load question groups
  const { data: questionGroups } = useSimpleList<QuestionGroupOption>(
    `question-groups-${subjectId}`,
    subjectId !== "all"
      ? `/api/v1/subjects/${subjectId}/question-groups`
      : ""
  );

  const addRule = () => {
    setRules([...rules, { difficulty: "MEDIUM", count: 1, points: 1 }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (
    index: number,
    field: keyof BlueprintRule,
    value: string | number
  ) => {
    setRules(
      rules.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      )
    );
  };

  // Calculate totals for blueprint mode
  const totalCount = rules.reduce((s, r) => s + r.count, 0);
  const totalPoints = rules.reduce((s, r) => s + r.count * r.points, 0);

  const handleBlueprintSubmit = async () => {
    if (rules.length === 0) return;

    setIsSubmitting(true);
    try {
      const result = await generateFromBlueprintsAction({
        sectionId,
        rules: rules.map((r) => ({
          subjectId: subjectId !== "all" ? subjectId : null,
          questionGroupId:
            questionGroupId !== "all" ? questionGroupId : null,
          difficulty: r.difficulty,
          count: r.count,
          points: r.points,
        })),
      });

      if (result.success) {
        toast.success(`สุ่มได้ ${result.data?.added ?? 0} ข้อสอบ`);
        onOpenChange(false);
        onGenerated();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimpleSubmit = async () => {
    if (simpleCount < 1) return;

    setIsSubmitting(true);
    try {
      const result = await simpleRandomAction({
        sectionId,
        subjectId: subjectId !== "all" ? subjectId : null,
        questionGroupId:
          questionGroupId !== "all" ? questionGroupId : null,
        count: simpleCount,
        points: simplePoints,
      });

      if (result.success) {
        toast.success(`สุ่มได้ ${result.data?.added ?? 0} ข้อสอบ`);
        onOpenChange(false);
        onGenerated();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>สุ่มข้อสอบ</DialogTitle>
          <DialogDescription>
            สุ่มข้อสอบจากคลังตามเงื่อนไขที่กำหนด
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="blueprint">แบ่งระดับ</TabsTrigger>
            <TabsTrigger value="simple">สุ่มอย่างง่าย</TabsTrigger>
          </TabsList>

          {/* Shared filters */}
          <div className="grid grid-cols-2 gap-3 mt-4">
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
          </div>

          {/* Blueprint tab */}
          <TabsContent value="blueprint" className="space-y-4 mt-4">
            <Label className="text-sm font-medium">เงื่อนไข:</Label>
            <div className="space-y-2">
              {rules.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-md border p-2"
                >
                  <Select
                    value={rule.difficulty}
                    onValueChange={(v) =>
                      updateRule(index, "difficulty", v)
                    }
                  >
                    <SelectTrigger className="h-8 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">ง่าย</SelectItem>
                      <SelectItem value="MEDIUM">ปานกลาง</SelectItem>
                      <SelectItem value="HARD">ยาก</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">
                      จำนวน:
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={rule.count}
                      onChange={(e) =>
                        updateRule(
                          index,
                          "count",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="h-8 w-16 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">
                      คะแนน/ข้อ:
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      value={rule.points}
                      onChange={(e) =>
                        updateRule(
                          index,
                          "points",
                          parseFloat(e.target.value) || 1
                        )
                      }
                      className="h-8 w-16 text-xs"
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => removeRule(index)}
                    disabled={rules.length <= 1}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={addRule}
            >
              <Plus className="h-3 w-3" />
              เพิ่มเงื่อนไข
            </Button>

            <div className="text-sm text-muted-foreground pt-2 border-t">
              รวม: {totalCount} ข้อ, {totalPoints} คะแนน
            </div>
          </TabsContent>

          {/* Simple random tab */}
          <TabsContent value="simple" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>จำนวนข้อ</Label>
                <Input
                  type="number"
                  min={1}
                  value={simpleCount}
                  onChange={(e) =>
                    setSimpleCount(parseInt(e.target.value) || 1)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>คะแนน/ข้อ</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={simplePoints}
                  onChange={(e) =>
                    setSimplePoints(parseFloat(e.target.value) || 1)
                  }
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button
            onClick={
              tab === "blueprint" ? handleBlueprintSubmit : handleSimpleSubmit
            }
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                กำลังสุ่ม...
              </>
            ) : (
              "สุ่มข้อสอบ"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
