"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
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

interface SectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { title: string; description?: string }) => Promise<void>;
  isSubmitting: boolean;
  initialData?: { title: string; description?: string | null };
  mode?: "create" | "edit";
}

export function SectionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
  mode = "create",
}: SectionFormDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(initialData?.title ?? "");
      setDescription(initialData?.description ?? "");
    }
  }, [open, initialData]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    await onSubmit({ title: title.trim(), description: description.trim() || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "เพิ่ม Section" : "แก้ไข Section"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "สร้างส่วนใหม่สำหรับจัดกลุ่มข้อสอบ"
              : "แก้ไขข้อมูลส่วนข้อสอบ"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>ชื่อ Section</Label>
            <Input
              placeholder="เช่น ส่วนที่ 1 - ปรนัย"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div className="space-y-2">
            <Label>คำอธิบาย (ไม่บังคับ)</Label>
            <Input
              placeholder="คำอธิบายสั้น ๆ สำหรับส่วนนี้"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : mode === "create" ? (
              "เพิ่ม Section"
            ) : (
              "บันทึก"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
