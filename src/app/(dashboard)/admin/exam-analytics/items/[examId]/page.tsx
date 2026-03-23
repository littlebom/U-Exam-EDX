"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ListChecks, X, Loader2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useList, useSimpleList } from "@/hooks/use-api";

// ─── Types ──────────────────────────────────────────────────────────

interface ItemAnalysis {
  questionId: string;
  questionTitle: string;
  totalResponses: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  difficultyIndex: number;
  discriminationIndex: number;
  optionAnalysis: Array<{
    option: string;
    selectedCount: number;
    selectedPercentage: number;
    isCorrect: boolean;
  }> | null;
}

interface ExamOption {
  id: string;
  title: string;
}

// ─── Helpers ────────────────────────────────────────────────────────

function getDifficultyStatus(index: number) {
  if (index >= 0.3 && index <= 0.7)
    return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">ดี</Badge>;
  if ((index > 0.7 && index <= 0.85) || (index >= 0.2 && index < 0.3))
    return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">ปรับปรุง</Badge>;
  return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">ไม่ดี</Badge>;
}

function getDiscriminationStatus(index: number) {
  if (index >= 0.4)
    return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">ดี</Badge>;
  if (index >= 0.2)
    return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">ปรับปรุง</Badge>;
  return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">ไม่ดี</Badge>;
}

function getOverallStatus(item: ItemAnalysis) {
  const diffOk = item.difficultyIndex >= 0.3 && item.difficultyIndex <= 0.7;
  const discOk = item.discriminationIndex >= 0.4;
  if (diffOk && discOk)
    return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">ดี</Badge>;
  if (!diffOk && !discOk)
    return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">ไม่ดี</Badge>;
  return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">ปรับปรุง</Badge>;
}

// ─── Page ───────────────────────────────────────────────────────────

export default function ItemAnalysisDetailPage() {
  const params = useParams();
  const examId = params.examId as string;
  const [selectedItem, setSelectedItem] = useState<ItemAnalysis | null>(null);

  const { data: exams } = useSimpleList<ExamOption>("exams", "/api/v1/exams");
  const examTitle = (exams ?? []).find((e) => e.id === examId)?.title ?? "วิชา";

  const { data: itemsData, isLoading } = useList<ItemAnalysis>(
    `analytics-items-${examId}`,
    "/api/v1/analytics/items",
    { examId, perPage: 50 }
  );

  const items = itemsData?.data ?? [];
  const total = itemsData?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/exam-analytics/items">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{examTitle}</h1>
          <p className="text-sm text-muted-foreground">
            วิเคราะห์คุณภาพข้อสอบ {total} ข้อ
          </p>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ตารางวิเคราะห์ข้อสอบ</CardTitle>
          <CardDescription>
            คลิกที่แถวเพื่อดูรายละเอียดการวิเคราะห์ตัวเลือก
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ListChecks className="h-10 w-10 mb-2" />
              <p className="text-sm">ยังไม่มีข้อมูลวิเคราะห์ข้อสอบ</p>
              <p className="text-xs mt-1">ข้อสอบแบบเลือกตอบที่มีผลสอบจะแสดงที่นี่</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ข้อที่</TableHead>
                  <TableHead>คำถาม</TableHead>
                  <TableHead className="text-center">Difficulty Index</TableHead>
                  <TableHead className="text-center">Discrimination Index</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow
                    key={item.questionId}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedItem?.questionId === item.questionId && "bg-muted/50"
                    )}
                    onClick={() =>
                      setSelectedItem(
                        selectedItem?.questionId === item.questionId ? null : item
                      )
                    }
                  >
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="max-w-[250px] truncate font-medium">
                      {item.questionTitle}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-10 text-right font-mono text-sm">
                          {item.difficultyIndex.toFixed(2)}
                        </span>
                        {getDifficultyStatus(item.difficultyIndex)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-10 text-right font-mono text-sm">
                          {item.discriminationIndex.toFixed(2)}
                        </span>
                        {getDiscriminationStatus(item.discriminationIndex)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getOverallStatus(item)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Option Analysis Detail */}
      {selectedItem && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">
                วิเคราะห์ตัวเลือก: {selectedItem.questionTitle}
              </CardTitle>
              <CardDescription>
                ผู้ตอบทั้งหมด {selectedItem.totalResponses} คน | ตอบถูก{" "}
                {selectedItem.correctCount} | ตอบผิด{" "}
                {selectedItem.incorrectCount} | ข้าม{" "}
                {selectedItem.skippedCount}
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedItem(null)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {selectedItem.optionAnalysis ? (
              <div className="space-y-3">
                {selectedItem.optionAnalysis.map((opt, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-medium",
                            opt.isCorrect
                              ? "text-green-700 dark:text-green-400"
                              : "text-foreground"
                          )}
                        >
                          {opt.option}
                        </span>
                        {opt.isCorrect && (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          >
                            เฉลย
                          </Badge>
                        )}
                      </div>
                      <span className="font-mono text-sm text-muted-foreground">
                        {opt.selectedCount} คน ({opt.selectedPercentage}%)
                      </span>
                    </div>
                    <Progress
                      value={opt.selectedPercentage}
                      className={cn(
                        "h-2",
                        opt.isCorrect
                          ? "[&>[data-slot=indicator]]:bg-green-500"
                          : "[&>[data-slot=indicator]]:bg-muted-foreground/40"
                      )}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                ข้อนี้เป็นข้อสอบอัตนัย ไม่มีตัวเลือกให้วิเคราะห์
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
