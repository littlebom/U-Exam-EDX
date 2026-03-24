"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateExamAction } from "@/actions/exam.actions";
import { toast } from "sonner";

interface ExamSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: Record<string, unknown>;
  examId: string;
  onUpdate: () => void;
}

export function ExamSettingsDialog({
  open,
  onOpenChange,
  exam,
  examId,
  onUpdate,
}: ExamSettingsDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("60");
  const [passingScore, setPassingScore] = useState("50");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle((exam.title as string) ?? "");
      setDescription((exam.description as string) ?? "");
      setDuration(String(exam.duration ?? 60));
      setPassingScore(String(exam.passingScore ?? 50));
    }
  }, [open, exam]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("กรุณาระบุชื่อชุดสอบ");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateExamAction(examId, {
        title: title.trim(),
        description: description.trim() || null,
        duration: parseInt(duration) || 60,
        passingScore: parseInt(passingScore) || 50,
      });

      if (result.success) {
        toast.success("บันทึกการตั้งค่าสำเร็จ");
        onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ตั้งค่าชุดสอบ</DialogTitle>
          <DialogDescription>แก้ไขข้อมูลเบื้องต้นของชุดสอบ</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>ชื่อชุดสอบ</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>คำอธิบาย</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ระยะเวลา (นาที)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>คะแนนผ่าน (%)</Label>
              <Input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 ตั้งค่าการคุมสอบ (Proctoring) ได้ที่หน้า &quot;ตารางสอบ&quot; → แก้ไขรอบสอบ
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              "บันทึก"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
