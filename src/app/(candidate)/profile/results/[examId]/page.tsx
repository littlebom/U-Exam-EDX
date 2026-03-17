"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Target,
  HelpCircle,
} from "lucide-react";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────

interface ResultDetail {
  id: string;
  exam: {
    id: string;
    title: string;
    passingScore: number;
    duration: number;
  };
  examDate: string;
  totalScore: number;
  maxScore: number;
  percentage: number | null;
  isPassed: boolean;
  status: string;
  gradedAt: string | null;
  startedAt: string;
  submittedAt: string;
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

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(startedAt: string, submittedAt: string) {
  const start = new Date(startedAt).getTime();
  const end = new Date(submittedAt).getTime();
  const diff = Math.round((end - start) / 60000);
  if (diff < 1) return "น้อยกว่า 1 นาที";
  return `${diff} นาที`;
}

// ─── Component ───────────────────────────────────────────────────────

export default function ResultDetailPage() {
  const params = useParams<{ examId: string }>();

  const { data, isLoading, isError } = useQuery<{ data: ResultDetail }>({
    queryKey: ["profile-result-detail", params.examId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/profile/results/${params.examId}`);
      if (!res.ok) throw new Error("Failed to fetch result detail");
      return res.json();
    },
  });

  const detail = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/profile/results">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            ไม่พบข้อมูลผลสอบ
          </h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <XCircle className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              ไม่พบข้อมูลผลสอบที่ต้องการ
            </p>
            <Link href="/profile/results">
              <Button variant="outline">กลับหน้าผลสอบ</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pct = detail.percentage ?? 0;
  const wrongAnswers = detail.totalQuestions - detail.correctAnswers;

  // Determine strong/weak categories
  const sortedCategories = [...detail.categoryScores].sort(
    (a, b) => b.percentage - a.percentage
  );
  const strongCategories = sortedCategories.filter((c) => c.percentage >= 70);
  const weakCategories = sortedCategories.filter((c) => c.percentage < 50);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/profile/results">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {detail.exam.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            รายละเอียดผลสอบ
          </p>
        </div>
      </div>

      {/* Score Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
            {/* Score Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-28 w-28 items-center justify-center rounded-full border-4 ${
                  detail.isPassed
                    ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                    : "border-red-500 bg-red-50 dark:bg-red-950/30"
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold">{pct}%</div>
                  <div className="text-xs text-muted-foreground">
                    {detail.totalScore}/{detail.maxScore}
                  </div>
                </div>
              </div>
              <Badge
                className={`mt-3 ${
                  detail.isPassed
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {detail.isPassed ? (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                ) : (
                  <XCircle className="mr-1 h-3 w-3" />
                )}
                {detail.isPassed ? "ผ่าน" : "ไม่ผ่าน"} (เกณฑ์{" "}
                {detail.exam.passingScore}%)
              </Badge>
            </div>

            {/* Quick Stats */}
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">วันสอบ</p>
                  <p className="text-sm font-medium">
                    {formatDateTime(detail.examDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">เวลาที่ใช้</p>
                  <p className="text-sm font-medium">
                    {detail.startedAt && detail.submittedAt
                      ? formatDuration(detail.startedAt, detail.submittedAt)
                      : `${detail.exam.duration} นาที`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Target className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">ตอบถูก</p>
                  <p className="text-sm font-medium">
                    {detail.correctAnswers}/{detail.totalQuestions} ข้อ
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <HelpCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">ตอบผิด</p>
                  <p className="text-sm font-medium">
                    {wrongAnswers}/{detail.totalQuestions} ข้อ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Scores Chart */}
      {detail.categoryScores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">คะแนนรายหมวด</CardTitle>
            <CardDescription>
              เปรียบเทียบคะแนนในแต่ละหมวดวิชา
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={detail.categoryScores}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis
                    type="category"
                    dataKey="categoryName"
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`${value}%`, "คะแนน"]}
                  />
                  <ReferenceLine
                    x={detail.exam.passingScore}
                    stroke="hsl(var(--destructive))"
                    strokeDasharray="5 5"
                    label={{
                      value: `เกณฑ์ ${detail.exam.passingScore}%`,
                      position: "top",
                      fontSize: 11,
                      fill: "hsl(var(--destructive))",
                    }}
                  />
                  <Bar
                    dataKey="percentage"
                    name="คะแนน %"
                    radius={[0, 4, 4, 0]}
                  >
                    {detail.categoryScores.map((entry) => (
                      <Cell
                        key={entry.categoryId}
                        fill={
                          entry.percentage >= 70
                            ? "oklch(0.55 0.15 145)" // green
                            : entry.percentage >= 50
                              ? "oklch(0.65 0.15 85)" // amber
                              : "oklch(0.55 0.2 25)" // red
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths and Weaknesses */}
      {detail.categoryScores.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Strengths */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                จุดแข็ง
              </CardTitle>
            </CardHeader>
            <CardContent>
              {strongCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ยังไม่มีหมวดที่คะแนนถึง 70%
                </p>
              ) : (
                <ul className="space-y-2">
                  {strongCategories.map((c) => (
                    <li
                      key={c.categoryId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{c.categoryName}</span>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      >
                        {c.percentage}%
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Weaknesses */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-400">
                <Target className="h-4 w-4" />
                ควรปรับปรุง
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weakCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ทุกหมวดได้คะแนนถึง 50% แล้ว
                </p>
              ) : (
                <ul className="space-y-2">
                  {weakCategories.map((c) => (
                    <li
                      key={c.categoryId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{c.categoryName}</span>
                      <Badge
                        variant="secondary"
                        className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      >
                        {c.percentage}%
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Back Button */}
      <div className="flex justify-center pb-4">
        <Link href="/profile/results">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าผลสอบ
          </Button>
        </Link>
      </div>
    </div>
  );
}
