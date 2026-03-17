"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ListChecks,
  FileX2,
  ChevronDown,
  ChevronRight,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useList, useSimpleList } from "@/hooks/use-api";
import {
  createRubricAction,
  updateRubricAction,
  deleteRubricAction,
} from "@/actions/grading.actions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ============================================================
// Types
// ============================================================

interface LevelDescriptor {
  label: string;
  minScore: number;
  maxScore: number;
  description: string;
}

interface RubricCriteria {
  id: string;
  name: string;
  description: string | null;
  maxScore: number;
  sortOrder: number;
  levels: LevelDescriptor[] | null;
}

interface RubricItem {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  examId: string | null;
  exam: { id: string; title: string } | null;
  criteria: RubricCriteria[];
  createdAt: string;
}

interface ExamOption {
  id: string;
  title: string;
}

interface LevelFormRow {
  tempId: string;
  label: string;
  minScore: number;
  maxScore: number;
  description: string;
}

interface CriteriaFormRow {
  tempId: string;
  id?: string;
  name: string;
  description: string;
  maxScore: number;
  levels: LevelFormRow[];
  showLevels: boolean;
}

const NONE_VALUE = "__none__";

// ============================================================
// Component
// ============================================================

export default function RubricsPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRubric, setEditingRubric] = useState<RubricItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RubricItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [examId, setExamId] = useState("");
  const [criteria, setCriteria] = useState<CriteriaFormRow[]>([]);

  const queryClient = useQueryClient();

  // Fetch rubrics
  const { data: rubricData, isLoading } = useList<RubricItem>(
    "rubrics",
    "/api/v1/rubrics",
    { perPage: 50 }
  );
  const rubrics = rubricData?.data ?? [];

  // Fetch exams for select
  const { data: exams } = useSimpleList<ExamOption>("exams", "/api/v1/exams");

  // Calculate total max score
  const totalMaxScore = useMemo(
    () => criteria.reduce((sum, c) => sum + (c.maxScore || 0), 0),
    [criteria]
  );

  // Reset form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setExamId("");
    setCriteria([]);
    setEditingRubric(null);
  };

  // Open create
  const handleCreate = () => {
    resetForm();
    setCriteria([
      { tempId: crypto.randomUUID(), name: "", description: "", maxScore: 10, levels: [], showLevels: false },
    ]);
    setSheetOpen(true);
  };

  // Open edit
  const handleEdit = (rubric: RubricItem) => {
    setEditingRubric(rubric);
    setTitle(rubric.title);
    setDescription(rubric.description ?? "");
    setExamId(rubric.examId ?? "");
    setCriteria(
      rubric.criteria.map((c) => ({
        tempId: crypto.randomUUID(),
        id: c.id,
        name: c.name,
        description: c.description ?? "",
        maxScore: c.maxScore,
        levels: (c.levels ?? []).map((l) => ({
          tempId: crypto.randomUUID(),
          label: l.label,
          minScore: l.minScore,
          maxScore: l.maxScore,
          description: l.description ?? "",
        })),
        showLevels: (c.levels ?? []).length > 0,
      }))
    );
    setSheetOpen(true);
  };

  // Add criteria row
  const addCriteria = () => {
    setCriteria((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        name: "",
        description: "",
        maxScore: 10,
        levels: [],
        showLevels: false,
      },
    ]);
  };

  // Toggle levels visibility
  const toggleLevels = (tempId: string) => {
    setCriteria((prev) =>
      prev.map((c) => (c.tempId === tempId ? { ...c, showLevels: !c.showLevels } : c))
    );
  };

  // Add level to criteria
  const addLevel = (criteriaTempId: string) => {
    setCriteria((prev) =>
      prev.map((c) =>
        c.tempId === criteriaTempId
          ? {
              ...c,
              showLevels: true,
              levels: [
                ...c.levels,
                { tempId: crypto.randomUUID(), label: "", minScore: 0, maxScore: c.maxScore, description: "" },
              ],
            }
          : c
      )
    );
  };

  // Remove level
  const removeLevel = (criteriaTempId: string, levelTempId: string) => {
    setCriteria((prev) =>
      prev.map((c) =>
        c.tempId === criteriaTempId
          ? { ...c, levels: c.levels.filter((l) => l.tempId !== levelTempId) }
          : c
      )
    );
  };

  // Update level field
  const updateLevel = (
    criteriaTempId: string,
    levelTempId: string,
    field: keyof LevelFormRow,
    value: string | number
  ) => {
    setCriteria((prev) =>
      prev.map((c) =>
        c.tempId === criteriaTempId
          ? {
              ...c,
              levels: c.levels.map((l) =>
                l.tempId === levelTempId ? { ...l, [field]: value } : l
              ),
            }
          : c
      )
    );
  };

  // Remove criteria row
  const removeCriteria = (tempId: string) => {
    setCriteria((prev) => prev.filter((c) => c.tempId !== tempId));
  };

  // Update criteria field
  const updateCriteria = (
    tempId: string,
    field: keyof CriteriaFormRow,
    value: string | number
  ) => {
    setCriteria((prev) =>
      prev.map((c) => (c.tempId === tempId ? { ...c, [field]: value } : c))
    );
  };

  // Submit form
  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("กรุณาระบุชื่อ Rubric");
      return;
    }
    if (criteria.length === 0) {
      toast.error("กรุณาเพิ่มเกณฑ์อย่างน้อย 1 รายการ");
      return;
    }
    if (criteria.some((c) => !c.name.trim())) {
      toast.error("กรุณาระบุชื่อเกณฑ์ทุกรายการ");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        examId: examId || undefined,
        criteria: criteria.map((c, i) => ({
          ...(c.id ? { id: c.id } : {}),
          name: c.name.trim(),
          description: c.description.trim() || undefined,
          maxScore: c.maxScore,
          sortOrder: i,
          levels: c.levels.length > 0
            ? c.levels.map((l) => ({
                label: l.label.trim(),
                minScore: l.minScore,
                maxScore: l.maxScore,
                description: l.description.trim() || undefined,
              }))
            : undefined,
        })),
      };

      const result = editingRubric
        ? await updateRubricAction(editingRubric.id, payload)
        : await createRubricAction(payload);

      if (result.success) {
        toast.success(editingRubric ? "แก้ไข Rubric สำเร็จ" : "สร้าง Rubric สำเร็จ");
        setSheetOpen(false);
        resetForm();
        queryClient.invalidateQueries({ queryKey: ["rubrics"] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete rubric
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deleteRubricAction(deleteTarget.id);
      if (result.success) {
        toast.success("ลบ Rubric สำเร็จ");
        setDeleteTarget(null);
        queryClient.invalidateQueries({ queryKey: ["rubrics"] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">จัดการ Rubric</h1>
          <p className="text-sm text-muted-foreground">
            กำหนดเกณฑ์การตรวจข้อสอบอัตนัย
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          สร้าง Rubric
        </Button>
      </div>

      {/* Rubrics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            รายการ Rubric ({rubrics.length})
          </CardTitle>
          <CardDescription>เกณฑ์การตรวจทั้งหมดที่สร้างไว้</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rubrics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileX2 className="h-10 w-10 mb-2" />
              <p className="text-sm">ยังไม่มี Rubric</p>
              <p className="text-xs mt-1">สร้าง Rubric เพื่อกำหนดเกณฑ์การตรวจ</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead className="hidden sm:table-cell">คำอธิบาย</TableHead>
                  <TableHead className="text-center">เกณฑ์</TableHead>
                  <TableHead className="text-center">คะแนนรวม</TableHead>
                  <TableHead className="hidden md:table-cell">ชุดสอบ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rubrics.map((rubric) => {
                  const totalScore = rubric.criteria.reduce(
                    (sum, c) => sum + c.maxScore,
                    0
                  );
                  return (
                    <TableRow key={rubric.id}>
                      <TableCell>
                        <span className="font-medium">{rubric.title}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground max-w-48 truncate block">
                          {rubric.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{rubric.criteria.length}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {totalScore}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {rubric.exam?.title || "— ไม่ระบุ —"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {rubric.isActive ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          >
                            ใช้งาน
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            ปิดใช้งาน
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(rubric)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(rubric)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl flex flex-col overflow-hidden"
          showCloseButton
        >
          <SheetHeader>
            <SheetTitle>
              {editingRubric ? "แก้ไข Rubric" : "สร้าง Rubric ใหม่"}
            </SheetTitle>
            <SheetDescription>
              {editingRubric
                ? "แก้ไขเกณฑ์การตรวจข้อสอบ"
                : "กำหนดเกณฑ์และคะแนนสำหรับการตรวจข้อสอบอัตนัย"}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 min-h-0 px-4">
            <div className="space-y-5 pb-6">
              {/* Title */}
              <div className="space-y-2">
                <Label>
                  ชื่อ Rubric <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น เกณฑ์ตรวจข้อเขียน"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>คำอธิบาย</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="อธิบายรายละเอียดเกณฑ์..."
                  className="min-h-20"
                />
              </div>

              {/* Exam Select */}
              <div className="space-y-2">
                <Label>ชุดข้อสอบ (ถ้าระบุจะใช้เฉพาะชุดนี้)</Label>
                <Select
                  value={examId || NONE_VALUE}
                  onValueChange={(v) => setExamId(v === NONE_VALUE ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกชุดสอบ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>— ไม่ระบุ (ใช้ทั่วไป) —</SelectItem>
                    {(exams ?? []).map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Criteria List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    เกณฑ์การให้คะแนน <span className="text-destructive">*</span>
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCriteria}
                    className="gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    เพิ่มเกณฑ์
                  </Button>
                </div>

                {criteria.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                    <ListChecks className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">ยังไม่มีเกณฑ์</p>
                    <p className="text-xs mt-1">กดปุ่ม "เพิ่มเกณฑ์" เพื่อเริ่มต้น</p>
                  </div>
                ) : (
                  criteria.map((c, idx) => (
                    <div key={c.tempId} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground mt-2">
                          #{idx + 1}
                        </span>
                        <div className="flex-1 space-y-2">
                          <Input
                            value={c.name}
                            onChange={(e) =>
                              updateCriteria(c.tempId, "name", e.target.value)
                            }
                            placeholder="ชื่อเกณฑ์ เช่น ความถูกต้อง"
                            className="text-sm"
                          />
                          <Input
                            value={c.description}
                            onChange={(e) =>
                              updateCriteria(c.tempId, "description", e.target.value)
                            }
                            placeholder="คำอธิบาย (ไม่บังคับ)"
                            className="text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 mt-1">
                          <Input
                            type="number"
                            min={0}
                            value={c.maxScore}
                            onChange={(e) =>
                              updateCriteria(
                                c.tempId,
                                "maxScore",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="h-9 w-16 text-center text-sm"
                          />
                          <span className="text-xs text-muted-foreground">คะแนน</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeCriteria(c.tempId)}
                            disabled={criteria.length <= 1}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Level Descriptors */}
                      <div className="ml-6 mt-1">
                        <button
                          type="button"
                          onClick={() => toggleLevels(c.tempId)}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {c.showLevels ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                          <Layers className="h-3 w-3" />
                          ระดับคะแนน ({c.levels.length})
                        </button>

                        {c.showLevels && (
                          <div className="mt-2 space-y-2">
                            {c.levels.map((level, lIdx) => (
                              <div
                                key={level.tempId}
                                className="rounded border bg-muted/30 p-2 space-y-1.5"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-medium text-muted-foreground w-4">
                                    L{lIdx + 1}
                                  </span>
                                  <Input
                                    value={level.label}
                                    onChange={(e) =>
                                      updateLevel(c.tempId, level.tempId, "label", e.target.value)
                                    }
                                    placeholder="ระดับ เช่น ดีมาก"
                                    className="text-xs h-7 flex-1"
                                  />
                                  <Input
                                    type="number"
                                    min={0}
                                    value={level.minScore}
                                    onChange={(e) =>
                                      updateLevel(
                                        c.tempId,
                                        level.tempId,
                                        "minScore",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="text-xs h-7 w-14 text-center"
                                    title="คะแนนต่ำสุด"
                                  />
                                  <span className="text-[10px] text-muted-foreground">–</span>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={level.maxScore}
                                    onChange={(e) =>
                                      updateLevel(
                                        c.tempId,
                                        level.tempId,
                                        "maxScore",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="text-xs h-7 w-14 text-center"
                                    title="คะแนนสูงสุด"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                    onClick={() => removeLevel(c.tempId, level.tempId)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="ml-6">
                                  <Input
                                    value={level.description}
                                    onChange={(e) =>
                                      updateLevel(
                                        c.tempId,
                                        level.tempId,
                                        "description",
                                        e.target.value
                                      )
                                    }
                                    placeholder="คำอธิบายระดับ (ไม่บังคับ)"
                                    className="text-xs h-7"
                                  />
                                </div>
                              </div>
                            ))}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addLevel(c.tempId)}
                              className="gap-1 h-7 text-xs"
                            >
                              <Plus className="h-3 w-3" />
                              เพิ่มระดับ
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {/* Total Score */}
                {criteria.length > 0 && (
                  <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">คะแนนรวมทั้งหมด</span>
                      <span className="text-lg font-bold text-primary">
                        {totalMaxScore} คะแนน
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingRubric ? "บันทึกการแก้ไข" : "สร้าง Rubric"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบ Rubric</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบ &quot;{deleteTarget?.title}&quot; หรือไม่?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
