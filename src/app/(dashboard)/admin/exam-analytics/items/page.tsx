"use client";

import Link from "next/link";
import { ListChecks, FileText, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSimpleList } from "@/hooks/use-api";

interface ExamOption {
  id: string;
  title: string;
  status: string;
  _count?: { questions: number };
}

export default function ItemAnalysisPage() {
  const { data: exams } = useSimpleList<ExamOption>("exams", "/api/v1/exams");
  const examList = exams ?? [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ListChecks className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            วิเคราะห์ข้อสอบ (Item Analysis)
          </h1>
          <p className="text-sm text-muted-foreground">
            เลือกวิชาเพื่อวิเคราะห์คุณภาพข้อสอบ
          </p>
        </div>
      </div>

      {/* Exam Cards */}
      {examList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ListChecks className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              ยังไม่มีชุดข้อสอบในระบบ
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {examList.map((exam) => (
            <Link
              key={exam.id}
              href={`/admin/exam-analytics/items/${exam.id}`}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 transition-all",
                "hover:border-primary/40 hover:shadow-sm hover:bg-primary/5"
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{exam.title}</p>
                <p className="text-xs text-muted-foreground">
                  {(exam._count?.questions ?? 0) > 0
                    ? `${exam._count?.questions} ข้อ`
                    : "ชุดข้อสอบ"}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
