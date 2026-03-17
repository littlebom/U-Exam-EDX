"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDetail } from "@/hooks/use-api";
import { ExamBuilder } from "@/components/exam-builder/exam-builder";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ExamDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const { data: exam, isLoading, error } = useDetail<Record<string, unknown>>(
    `exam-builder-${id}`,
    `/api/v1/exams/${id}/builder`
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">ไม่พบชุดสอบ</p>
        <Button variant="outline" onClick={() => router.push("/exams")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          ย้อนกลับ
        </Button>
      </div>
    );
  }

  return <ExamBuilder exam={exam} examId={id} />;
}
