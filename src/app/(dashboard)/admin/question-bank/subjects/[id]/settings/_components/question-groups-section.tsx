"use client";

import React, { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  BookOpen,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Separator } from "@/components/ui/separator";
import { useQueryClient } from "@tanstack/react-query";
import {
  createQuestionGroupAction,
  updateQuestionGroupAction,
  deleteQuestionGroupAction,
} from "@/actions/question-group.actions";
import { toast } from "sonner";
import { ColorPickerInline, PRESET_COLORS } from "./color-picker-inline";

import type { QuestionGroupItem } from "@/types/question-bank";

interface QuestionGroupsSectionProps {
  subjectId: string;
  groups: QuestionGroupItem[] | undefined;
  isLoading: boolean;
}

// ============================================================
// Component
// ============================================================
export function QuestionGroupsSection({
  subjectId,
  groups,
  isLoading,
}: QuestionGroupsSectionProps) {
  const queryClient = useQueryClient();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState<string>(PRESET_COLORS[5]);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuestionGroupItem | null>(
    null
  );

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: [`question-groups-${subjectId}`],
    });
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormName("");
    setFormDescription("");
    setFormColor(PRESET_COLORS[5]);
  };

  const startEdit = (group: QuestionGroupItem) => {
    setEditingId(group.id);
    setIsAdding(false);
    setFormName(group.name);
    setFormDescription(group.description || "");
    setFormColor(group.color || PRESET_COLORS[5]);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormName("");
    setFormDescription("");
    setFormColor(PRESET_COLORS[5]);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setIsSaving(true);

    try {
      if (editingId) {
        const result = await updateQuestionGroupAction({
          id: editingId,
          name: formName.trim(),
          description: formDescription.trim() || null,
          color: formColor,
        });
        if (result.success) {
          toast.success("อัพเดตกลุ่มข้อสอบสำเร็จ");
          cancelForm();
          invalidate();
        } else {
          toast.error(result.error || "เกิดข้อผิดพลาด");
        }
      } else {
        const result = await createQuestionGroupAction({
          subjectId,
          name: formName.trim(),
          description: formDescription.trim() || null,
          color: formColor,
          sortOrder: groups?.length ?? 0,
        });
        if (result.success) {
          toast.success("สร้างกลุ่มข้อสอบสำเร็จ");
          cancelForm();
          invalidate();
        } else {
          toast.error(result.error || "เกิดข้อผิดพลาด");
        }
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const result = await deleteQuestionGroupAction(deleteTarget.id);
      if (result.success) {
        toast.success("ลบกลุ่มข้อสอบสำเร็จ");
        invalidate();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setDeleteTarget(null);
    }
  };

  const renderFormRow = () => (
    <TableRow>
      <TableCell>
        <ColorPickerInline value={formColor} onChange={setFormColor} />
      </TableCell>
      <TableCell>
        <Input
          placeholder="ชื่อกลุ่ม"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className="h-8 text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") cancelForm();
          }}
        />
      </TableCell>
      <TableCell>
        <Input
          placeholder="คำอธิบาย (ไม่บังคับ)"
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") cancelForm();
          }}
        />
      </TableCell>
      <TableCell />
      <TableCell>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-green-600 hover:text-green-700"
            disabled={!formName.trim() || isSaving}
            onClick={handleSave}
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={cancelForm}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              กลุ่มข้อสอบ
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              จัดการกลุ่มข้อสอบสำหรับแบ่งหมวดหมู่ข้อสอบภายในวิชา
            </p>
          </div>
          {!isAdding && !editingId && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={startAdd}
            >
              <Plus className="h-3.5 w-3.5" />
              เพิ่มกลุ่ม
            </Button>
          )}
        </div>
        <Separator className="my-4" />

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">สี</TableHead>
                <TableHead>ชื่อกลุ่ม</TableHead>
                <TableHead>คำอธิบาย</TableHead>
                <TableHead className="w-[80px] text-right">ข้อสอบ</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups?.map((group) =>
                editingId === group.id ? (
                  <React.Fragment key={group.id}>{renderFormRow()}</React.Fragment>
                ) : (
                  <TableRow key={group.id}>
                    <TableCell>
                      {group.color && (
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {group.description || "-"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {group._count.questions}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => startEdit(group)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(group)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )}
              {isAdding && renderFormRow()}
              {(!groups || groups.length === 0) && !isAdding && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    ยังไม่มีกลุ่มข้อสอบ — คลิก &quot;เพิ่มกลุ่ม&quot;
                    เพื่อสร้างกลุ่มแรก
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </section>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบกลุ่มข้อสอบ</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบกลุ่ม &quot;{deleteTarget?.name}&quot; ใช่หรือไม่?
              {deleteTarget && deleteTarget._count.questions > 0 && (
                <>
                  <br />
                  <br />
                  ข้อสอบ {deleteTarget._count.questions}{" "}
                  ข้อในกลุ่มนี้จะไม่ถูกลบ แต่จะถูกยกเลิกกลุ่มออก
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบกลุ่ม
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
