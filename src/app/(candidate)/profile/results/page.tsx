"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, X, Loader2, ExternalLink } from "lucide-react";
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────

interface ExamResult {
  id: string;
  examTitle: string;
  examId: string;
  examDate: string;
  totalScore: number;
  maxScore: number;
  percentage: number | null;
  isPassed: boolean;
  status: string;
  gradedAt: string | null;
  sessionId: string;
}

interface ResultDetail {
  id: string;
  exam: { id: string; title: string; passingScore: number; duration: number };
  examDate: string;
  totalScore: number;
  maxScore: number;
  percentage: number | null;
  isPassed: boolean;
  categoryScores: Array<{
    categoryId: string;
    categoryName: string;
    score: number;
    maxScore: number;
    percentage: number;
  }>;
  totalQuestions: number;
  correctAnswers: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Component ───────────────────────────────────────────────────────

export default function ExamResultsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: resultsData, isLoading } = useQuery<{
    data: ExamResult[];
    meta: { total: number };
  }>({
    queryKey: ["profile-results"],
    queryFn: async () => {
      const res = await fetch("/api/v1/profile/results?perPage=50");
      if (!res.ok) throw new Error("Failed to fetch results");
      return res.json();
    },
  });

  const { data: detailData } = useQuery<{ data: ResultDetail }>({
    queryKey: ["profile-result-detail", selectedId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/profile/results/${selectedId}`);
      if (!res.ok) throw new Error("Failed to fetch detail");
      return res.json();
    },
    enabled: !!selectedId,
  });

  const results = resultsData?.data ?? [];
  const detail = detailData?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ประวัติผลสอบ</h1>
        <p className="text-sm text-muted-foreground">
          ผลสอบทั้งหมด {results.length} รายการ
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Results Table */}
        <Card className={selectedId ? "lg:col-span-3" : "lg:col-span-5"}>
          <CardHeader>
            <CardTitle className="text-base">รายการผลสอบ</CardTitle>
            <CardDescription>คลิกเพื่อดูรายละเอียด</CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mb-2 opacity-50" />
                <p>ยังไม่มีผลสอบ</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชุดสอบ</TableHead>
                    <TableHead className="text-center">คะแนน</TableHead>
                    <TableHead className="text-center">%</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                    <TableHead className="text-right">วันสอบ</TableHead>
                    <TableHead className="w-[40px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow
                      key={result.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedId(result.id)}
                    >
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {result.examTitle}
                      </TableCell>
                      <TableCell className="text-center">
                        {result.totalScore}/{result.maxScore}
                      </TableCell>
                      <TableCell className="text-center">
                        {result.percentage ?? 0}%
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={
                            result.isPassed
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }
                        >
                          {result.isPassed ? "ผ่าน" : "ไม่ผ่าน"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDate(result.examDate)}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/profile/results/${result.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detail Panel */}
        {selectedId && detail && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">รายละเอียดผลสอบ</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedId(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>{detail.exam.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Score Summary */}
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <div className="text-3xl font-bold">
                  {detail.percentage ?? 0}%
                </div>
                <p className="text-sm text-muted-foreground">
                  {detail.totalScore}/{detail.maxScore} คะแนน
                </p>
                <Badge
                  variant="secondary"
                  className={
                    detail.isPassed
                      ? "mt-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "mt-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }
                >
                  {detail.isPassed ? "ผ่าน" : "ไม่ผ่าน"} (เกณฑ์{" "}
                  {detail.exam.passingScore}%)
                </Badge>
              </div>

              {/* Category Scores Chart */}
              {detail.categoryScores.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">
                    คะแนนรายหมวด
                  </h4>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={detail.categoryScores}
                        layout="vertical"
                        margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                        />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis
                          type="category"
                          dataKey="categoryName"
                          width={100}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar
                          dataKey="percentage"
                          name="คะแนน %"
                          fill="oklch(0.34 0.13 25)"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg border p-3">
                  <div className="text-lg font-bold">
                    {detail.correctAnswers}
                  </div>
                  <p className="text-xs text-muted-foreground">ข้อถูก</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-lg font-bold">
                    {detail.totalQuestions}
                  </div>
                  <p className="text-xs text-muted-foreground">ข้อทั้งหมด</p>
                </div>
              </div>

              {/* Detail Page Link */}
              <Link href={`/profile/results/${selectedId}`}>
                <Button variant="outline" size="sm" className="w-full gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  ดูรายละเอียดเพิ่มเติม
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
