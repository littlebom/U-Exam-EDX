"use client";

import Link from "next/link";
import {
  FileText,
  Users,
  TrendingUp,
  CheckCircle2,
  Plus,
  ClipboardList,
  BarChart3,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Types ──────────────────────────────────────────────────────────

interface OverviewStats {
  totalExams: number;
  totalCandidates: number;
  averagePassRate: number;
  averageScore: number;
}

interface TrendItem {
  label: string;
  totalCandidates: number;
  averagePassRate: number;
}

interface GradeRow {
  id: string;
  totalScore: number;
  maxScore: number;
  isPassed: boolean;
  publishedAt: string;
  session: {
    candidate: { name: string; email: string };
    examSchedule: { exam: { title: string } };
  };
}

// ─── Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: overviewResult, isLoading } = useQuery<{ data: OverviewStats }>({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const res = await fetch("/api/v1/analytics/overview");
      return res.json();
    },
  });

  const { data: trendResult } = useQuery<{ data: { trends: TrendItem[] } }>({
    queryKey: ["dashboard-trends"],
    queryFn: async () => {
      const res = await fetch("/api/v1/analytics/trends?months=6");
      return res.json();
    },
  });

  const { data: gradesResult } = useQuery<{ data: GradeRow[] }>({
    queryKey: ["dashboard-recent-grades"],
    queryFn: async () => {
      const res = await fetch("/api/v1/grades?status=PUBLISHED&perPage=5");
      return res.json();
    },
  });

  const overview = overviewResult?.data ?? {
    totalExams: 0,
    totalCandidates: 0,
    averagePassRate: 0,
    averageScore: 0,
  };

  const trendData = (trendResult?.data?.trends ?? []).map((t) => ({
    label: t.label,
    candidates: t.totalCandidates,
    passRate: t.averagePassRate,
  }));

  const recentGrades = gradesResult?.data ?? [];

  const statsCards = [
    {
      title: "จำนวนสอบทั้งหมด",
      value: overview.totalExams.toString(),
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "ผู้เข้าสอบ",
      value: overview.totalCandidates.toString(),
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "อัตราผ่านสอบ",
      value: `${overview.averagePassRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      title: "คะแนนเฉลี่ย",
      value: `${overview.averageScore.toFixed(1)}%`,
      icon: CheckCircle2,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">แดชบอร์ด</h1>
          <p className="text-sm text-muted-foreground">
            ภาพรวมระบบจัดการสอบของคุณ
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/question-bank">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              สร้างข้อสอบ
            </Button>
          </Link>
          <Link href="/admin/exams">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ClipboardList className="h-4 w-4" />
              สร้างชุดสอบ
            </Button>
          </Link>
          <Link href="/admin/exam-analytics">
            <Button size="sm" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              ดูรายงาน
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                {card.title}
              </CardDescription>
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md",
                  card.bgColor
                )}
              >
                <card.icon className={cn("h-4 w-4", card.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Recent Grades */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Bar Chart — 6 months trend */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">สถิติรายเดือน</CardTitle>
            <CardDescription>
              จำนวนผู้เข้าสอบ 6 เดือนล่าสุด
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {trendData.some((t) => t.candidates > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={trendData}
                    margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Bar
                      dataKey="candidates"
                      name="ผู้เข้าสอบ"
                      fill="oklch(0.34 0.13 25)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  ยังไม่มีข้อมูล
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Published Grades */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">ผลสอบล่าสุด</CardTitle>
            <CardDescription>ผลสอบที่เผยแพร่แล้ว 5 รายการล่าสุด</CardDescription>
          </CardHeader>
          <CardContent>
            {recentGrades.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                ยังไม่มีผลสอบ
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ผู้สอบ</TableHead>
                    <TableHead>ผล</TableHead>
                    <TableHead className="text-right">คะแนน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentGrades.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">
                            {g.session?.candidate?.name ?? "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {g.session?.examSchedule?.exam?.title ?? "—"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {g.isPassed ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            ผ่าน
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            ไม่ผ่าน
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {g.totalScore}/{g.maxScore}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
