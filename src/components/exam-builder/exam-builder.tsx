"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Settings,
  Plus,
  FileText,
  Clock,
  Target,
  Loader2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "./section-card";
import { SectionFormDialog } from "./section-form-dialog";
import { ExamSettingsDialog } from "./exam-settings-dialog";
import { addSectionAction } from "@/actions/exam.actions";
import { toast } from "sonner";

// ============================================================
// Types
// ============================================================

interface ExamBuilderProps {
  exam: Record<string, unknown>;
  examId: string;
}

type ExamStatus = "DRAFT" | "PUBLISHED" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

function getExamStatusBadge(status: ExamStatus) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="secondary">แบบร่าง</Badge>;
    case "PUBLISHED":
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          เผยแพร่
        </Badge>
      );
    case "ACTIVE":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          กำลังดำเนินการ
        </Badge>
      );
    case "COMPLETED":
      return <Badge variant="outline">เสร็จสิ้น</Badge>;
    case "ARCHIVED":
      return <Badge variant="outline">เก็บถาวร</Badge>;
  }
}

function formatDuration(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins} นาที`;
  if (mins === 0) return `${hrs} ชม.`;
  return `${hrs} ชม. ${mins} น.`;
}

// ============================================================
// Component
// ============================================================

export function ExamBuilder({ exam, examId }: ExamBuilderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [isAddingSection, setIsAddingSection] = useState(false);

  const sections = (exam.sections ?? []) as Array<Record<string, unknown>>;
  const status = (exam.status ?? "DRAFT") as ExamStatus;
  const totalPoints = (exam.totalPoints ?? 0) as number;
  const duration = (exam.duration ?? 60) as number;
  const passingScore = (exam.passingScore ?? 50) as number;

  // Count total questions across all sections
  const totalQuestions = sections.reduce((sum, section) => {
    const questions = (section.questions ?? []) as unknown[];
    return sum + questions.length;
  }, 0);

  const invalidateExam = () => {
    queryClient.invalidateQueries({ queryKey: [`exam-builder-${examId}`] });
  };

  const handleAddSection = async (data: {
    title: string;
    description?: string;
  }) => {
    setIsAddingSection(true);
    try {
      const result = await addSectionAction(examId, {
        title: data.title,
        description: data.description || null,
        sortOrder: sections.length,
      });

      if (result.success) {
        toast.success("เพิ่มส่วนสำเร็จ");
        setSectionDialogOpen(false);
        invalidateExam();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsAddingSection(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5 shrink-0"
            onClick={() => router.push("/exams")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {exam.title as string}
            </h1>
            {(exam.description as string) && (
              <p className="text-sm text-muted-foreground mt-1">
                {exam.description as string}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {getExamStatusBadge(status)}
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                {totalQuestions} ข้อ
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                {totalPoints} คะแนน (ผ่าน {passingScore}%)
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(duration)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            className="gap-1.5"
            disabled={totalQuestions === 0}
            onClick={() => window.open(`/preview/${examId}`, "_blank")}
          >
            <Eye className="h-4 w-4" />
            ดูตัวอย่าง
          </Button>
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => setSettingsDialogOpen(true)}
          >
            <Settings className="h-4 w-4" />
            ตั้งค่า
          </Button>
        </div>
      </div>

      {/* Sections */}
      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 gap-4">
          <p className="text-muted-foreground">
            ยังไม่มีส่วนข้อสอบ เริ่มต้นโดยเพิ่มส่วนแรก
          </p>
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => setSectionDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            เพิ่ม Section
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <SectionCard
              key={section.id as string}
              section={section}
              sectionIndex={index}
              examId={examId}
              onUpdate={invalidateExam}
            />
          ))}

          <Button
            variant="outline"
            className="gap-1.5 w-full border-dashed"
            onClick={() => setSectionDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            เพิ่ม Section
          </Button>
        </div>
      )}

      {/* Section Form Dialog */}
      <SectionFormDialog
        open={sectionDialogOpen}
        onOpenChange={setSectionDialogOpen}
        onSubmit={handleAddSection}
        isSubmitting={isAddingSection}
      />

      {/* Exam Settings Dialog */}
      <ExamSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        exam={exam}
        examId={examId}
        onUpdate={invalidateExam}
      />
    </div>
  );
}
