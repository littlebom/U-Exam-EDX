"use client";

import { useState, useEffect } from "react";
import { FileText, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { updateSubjectAction } from "@/actions/subject.actions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { SubjectDetail, CategoryItem } from "@/types/question-bank";

interface SubjectInfoSectionProps {
  subjectId: string;
  subject: SubjectDetail;
  categories: CategoryItem[] | undefined;
}

// ============================================================
// Component
// ============================================================
export function SubjectInfoSection({
  subjectId,
  subject,
  categories,
}: SubjectInfoSectionProps) {
  const queryClient = useQueryClient();

  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");
  const [subjectCategoryId, setSubjectCategoryId] = useState<string>("NONE");
  const [isSavingSubject, setIsSavingSubject] = useState(false);
  const [subjectDirty, setSubjectDirty] = useState(false);

  useEffect(() => {
    if (subject) {
      setSubjectName(subject.name);
      setSubjectCode(subject.code);
      setSubjectDescription(subject.description || "");
      setSubjectCategoryId(subject.categoryId || "NONE");
      setSubjectDirty(false);
    }
  }, [subject]);

  const updateField = <T,>(setter: (v: T) => void, value: T) => {
    setter(value);
    setSubjectDirty(true);
  };

  const handleSave = async () => {
    if (!subjectName.trim() || !subjectCode.trim()) {
      toast.error("กรุณากรอกรหัสวิชาและชื่อวิชา");
      return;
    }
    setIsSavingSubject(true);
    try {
      const result = await updateSubjectAction({
        id: subjectId,
        code: subjectCode.trim(),
        name: subjectName.trim(),
        description: subjectDescription.trim() || undefined,
        categoryId:
          subjectCategoryId === "NONE" ? undefined : subjectCategoryId,
      });
      if (result.success) {
        toast.success("บันทึกข้อมูลวิชาสำเร็จ");
        setSubjectDirty(false);
        queryClient.invalidateQueries({ queryKey: [`subject-${subjectId}`] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSavingSubject(false);
    }
  };

  const handleReset = () => {
    setSubjectName(subject.name);
    setSubjectCode(subject.code);
    setSubjectDescription(subject.description || "");
    setSubjectCategoryId(subject.categoryId || "NONE");
    setSubjectDirty(false);
  };

  return (
    <section>
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-5 w-5 text-muted-foreground" />
          ข้อมูลวิชา
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          แก้ไขรหัสวิชา ชื่อวิชา คำอธิบาย และหมวดหมู่
        </p>
      </div>
      <Separator className="my-4" />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              รหัสวิชา <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="เช่น IT101, MATH201"
              value={subjectCode}
              onChange={(e) => updateField(setSubjectCode, e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              ชื่อวิชา <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="ชื่อวิชา"
              value={subjectName}
              onChange={(e) => updateField(setSubjectName, e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              คำอธิบาย{" "}
              <span className="font-normal text-muted-foreground">
                (ไม่บังคับ)
              </span>
            </Label>
            <Textarea
              placeholder="คำอธิบายเกี่ยวกับวิชานี้..."
              rows={3}
              value={subjectDescription}
              onChange={(e) =>
                updateField(setSubjectDescription, e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              หมวดหมู่{" "}
              <span className="font-normal text-muted-foreground">
                (ไม่บังคับ)
              </span>
            </Label>
            <Select
              value={subjectCategoryId}
              onValueChange={(v) => updateField(setSubjectCategoryId, v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">ไม่ระบุ</SelectItem>
                {(Array.isArray(categories) ? categories : []).map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {subjectDirty && (
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              ยกเลิก
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              disabled={
                isSavingSubject ||
                !subjectName.trim() ||
                !subjectCode.trim()
              }
              onClick={handleSave}
            >
              {isSavingSubject ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              บันทึก
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
