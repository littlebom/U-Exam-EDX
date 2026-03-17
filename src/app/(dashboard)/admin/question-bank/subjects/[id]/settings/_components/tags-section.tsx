"use client";

import React, { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Check, X, Tag } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import {
  createTagAction,
  updateTagAction,
  deleteTagAction,
} from "@/actions/category.actions";
import { toast } from "sonner";
import { ColorPickerInline, PRESET_COLORS } from "./color-picker-inline";

import type { TagItem } from "@/types/question-bank";

interface TagsSectionProps {
  tags: TagItem[] | undefined;
  isLoading: boolean;
}

// ============================================================
// Component
// ============================================================
export function TagsSection({ tags, isLoading }: TagsSectionProps) {
  const queryClient = useQueryClient();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState<string>(PRESET_COLORS[4]);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TagItem | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["tags"] });
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormName("");
    setFormColor(PRESET_COLORS[4]);
  };

  const startEdit = (tag: TagItem) => {
    setEditingId(tag.id);
    setIsAdding(false);
    setFormName(tag.name);
    setFormColor(tag.color || PRESET_COLORS[4]);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormName("");
    setFormColor(PRESET_COLORS[4]);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setIsSaving(true);

    try {
      if (editingId) {
        const result = await updateTagAction({
          id: editingId,
          name: formName.trim(),
          color: formColor,
        });
        if (result.success) {
          toast.success("อัพเดตแท็กสำเร็จ");
          cancelForm();
          invalidate();
        } else {
          toast.error(result.error || "เกิดข้อผิดพลาด");
        }
      } else {
        const result = await createTagAction({
          name: formName.trim(),
          color: formColor,
        });
        if (result.success) {
          toast.success("สร้างแท็กสำเร็จ");
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
      const result = await deleteTagAction(deleteTarget.id);
      if (result.success) {
        toast.success("ลบแท็กสำเร็จ");
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
        <div className="flex items-center gap-3">
          <ColorPickerInline value={formColor} onChange={setFormColor} />
          <Input
            placeholder="ชื่อแท็ก"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="h-8 max-w-[200px] text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") cancelForm();
            }}
          />
        </div>
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
              <Tag className="h-5 w-5 text-muted-foreground" />
              แท็ก
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              แท็กใช้สำหรับจัดกลุ่มและค้นหาข้อสอบข้ามวิชา
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
              เพิ่มแท็ก
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
                <TableHead>แท็ก</TableHead>
                <TableHead className="w-[80px] text-right">ข้อสอบ</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags?.map((tag) =>
                editingId === tag.id ? (
                  <React.Fragment key={tag.id}>{renderFormRow()}</React.Fragment>
                ) : (
                  <TableRow key={tag.id}>
                    <TableCell>
                      {tag.color ? (
                        <Badge
                          variant="outline"
                          className="gap-1.5 border-transparent px-2 py-0.5"
                          style={{
                            backgroundColor: tag.color + "18",
                            color: tag.color,
                          }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </Badge>
                      ) : (
                        <span className="text-sm font-medium">{tag.name}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {tag._count.questionTags}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => startEdit(tag)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(tag)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )}
              {isAdding && renderFormRow()}
              {(!tags || tags.length === 0) && !isAdding && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-8 text-center text-muted-foreground"
                  >
                    ยังไม่มีแท็ก — คลิก &quot;เพิ่มแท็ก&quot;
                    เพื่อสร้างแท็กแรก
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
            <AlertDialogTitle>ลบแท็ก</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบแท็ก &quot;{deleteTarget?.name}&quot; ใช่หรือไม่?
              {deleteTarget && deleteTarget._count.questionTags > 0 && (
                <>
                  <br />
                  <br />
                  แท็กนี้ถูกใช้กับข้อสอบ {deleteTarget._count.questionTags}{" "}
                  ข้อ — ข้อสอบจะไม่ถูกลบ แต่จะถูกยกเลิกแท็กออก
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
              ลบแท็ก
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
