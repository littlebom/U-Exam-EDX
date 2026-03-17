"use client";

import { useState } from "react";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { SectionQuestionRow } from "./section-question-row";
import { SectionFormDialog } from "./section-form-dialog";
import { AddQuestionMenu } from "./add-question-menu";
import { QuestionPickerDialog } from "./question-picker-dialog";
import { BlueprintDialog } from "./blueprint-dialog";
import { CreateQuestionDialog } from "./create-question-dialog";
import {
  updateSectionAction,
  deleteSectionAction,
  removeSectionQuestionAction,
} from "@/actions/exam.actions";
import { toast } from "sonner";

interface SectionCardProps {
  section: Record<string, unknown>;
  sectionIndex: number;
  examId: string;
  onUpdate: () => void;
}

export function SectionCard({
  section,
  sectionIndex,
  examId,
  onUpdate,
}: SectionCardProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [blueprintOpen, setBlueprintOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sectionId = section.id as string;
  const title = (section.title as string) ?? `ส่วนที่ ${sectionIndex + 1}`;
  const description = section.description as string | null;
  const questions = (section.questions ?? []) as Array<Record<string, unknown>>;

  // Calculate section totals
  const sectionPoints = questions.reduce((sum, sq) => {
    const pts =
      (sq.points as number | null) ??
      ((sq.question as Record<string, unknown>)?.points as number) ??
      1;
    return sum + pts;
  }, 0);

  const handleEditSection = async (data: {
    title: string;
    description?: string;
  }) => {
    setIsSubmitting(true);
    try {
      const result = await updateSectionAction(sectionId, data);
      if (result.success) {
        toast.success("แก้ไข Section สำเร็จ");
        setEditDialogOpen(false);
        onUpdate();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSection = async () => {
    try {
      const result = await deleteSectionAction(sectionId);
      if (result.success) {
        toast.success("ลบ Section สำเร็จ");
        setDeleteDialogOpen(false);
        onUpdate();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleRemoveQuestion = async (questionLinkId: string) => {
    try {
      const result = await removeSectionQuestionAction(questionLinkId);
      if (result.success) {
        toast.success("ลบข้อสอบออกจาก Section สำเร็จ");
        onUpdate();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  // Get existing question IDs for the picker to disable
  const existingQuestionIds = questions.map(
    (sq) => (sq.question as Record<string, unknown>)?.id as string
  ).filter(Boolean);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <div>
                <h3 className="text-base font-semibold">{title}</h3>
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground mr-2">
                {questions.length} ข้อ &middot; {sectionPoints} คะแนน
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setEditDialogOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {questions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>คำถาม</TableHead>
                  <TableHead className="w-[100px]">ประเภท</TableHead>
                  <TableHead className="w-[100px]">ระดับ</TableHead>
                  <TableHead className="w-[80px] text-center">คะแนน</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((sq, idx) => (
                  <SectionQuestionRow
                    key={sq.id as string}
                    sectionQuestion={sq}
                    index={idx}
                    onRemove={() => handleRemoveQuestion(sq.id as string)}
                  />
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              ยังไม่มีข้อสอบในส่วนนี้
            </div>
          )}

          <div className="mt-4">
            <AddQuestionMenu
              onPickFromBank={() => setPickerOpen(true)}
              onRandomize={() => setBlueprintOpen(true)}
              onCreateNew={() => setCreateOpen(true)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Edit Section Dialog */}
      <SectionFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditSection}
        isSubmitting={isSubmitting}
        initialData={{ title, description }}
        mode="edit"
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบ Section</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบ &quot;{title}&quot; หรือไม่? ข้อสอบที่อยู่ใน Section
              นี้จะถูกลบออกจากชุดสอบด้วย (ข้อสอบในคลังจะยังคงอยู่)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSection}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบ Section
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Question Picker */}
      <QuestionPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        sectionId={sectionId}
        existingQuestionIds={existingQuestionIds}
        onAdded={onUpdate}
      />

      {/* Blueprint / Random */}
      <BlueprintDialog
        open={blueprintOpen}
        onOpenChange={setBlueprintOpen}
        sectionId={sectionId}
        onGenerated={onUpdate}
      />

      {/* Create New Question */}
      <CreateQuestionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        sectionId={sectionId}
        examId={examId}
        onCreated={onUpdate}
      />
    </>
  );
}
