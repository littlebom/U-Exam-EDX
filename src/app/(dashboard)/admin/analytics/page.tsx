"use client";

import {
  BarChart3,
  Users,
  CheckCircle2,
  Shield,
  FileDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useDetail } from "@/hooks/use-api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

// ─── Types ──────────────────────────────────────────────────────────

interface OverviewStats {
  totalExams: number;
  totalCandidates: number;
  averagePassRate: number;
  averageScore: number;
  passCount: number;
  failCount: number;
  highestScore: number;
  lowestScore: number;
  medianScore: number;
  standardDeviation: number;
}

interface ScoreDistData {
  total: number;
  distribution: Array<{ range: string; count: number; percentage: number }>;
}

interface TrendData {
  trends: Array<{
    month: string;
    label: string;
    totalExams: number;
    totalCandidates: number;
    averagePassRate: number;
    averageScore: number;
  }>;
}

const PIE_COLORS = ["oklch(0.55 0.15 145)", "oklch(0.55 0.2 25)"];

export default function AnalyticsDashboardPage() {
  // Fetch real data
  const { data: stats, isLoading: statsLoading } = useDetail<OverviewStats>(
    "analytics-overview",
    "/api/v1/analytics/overview"
  );
  const { data: scoreDist } = useDetail<ScoreDistData>(
    "analytics-score-dist",
    "/api/v1/analytics/score-distribution"
  );
  const { data: trendResult } = useDetail<TrendData>(
    "analytics-trends",
    "/api/v1/analytics/trends"
  );

  const overview = stats ?? {
    totalExams: 0,
    totalCandidates: 0,
    averagePassRate: 0,
    averageScore: 0,
    passCount: 0,
    failCount: 0,
    highestScore: 0,
    lowestScore: 0,
    medianScore: 0,
    standardDeviation: 0,
  };

  const scoreDistData = scoreDist?.distribution ?? [];
  const trendData = (trendResult?.trends ?? []).map((t) => ({
    label: t.label,
    candidates: t.totalCandidates,
    passRate: t.averagePassRate,
    avgScore: t.averageScore,
  }));

  const pieData = [
    { name: "ผ่าน", value: overview.passCount },
    { name: "ไม่ผ่าน", value: overview.failCount },
  ];

  const statsCards = [
    {
      title: "สอบทั้งหมด",
      value: overview.totalExams.toString(),
      icon: BarChart3,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "ผู้เข้าสอบ",
      value: overview.totalCandidates.toLocaleString(),
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "อัตราผ่านเฉลี่ย",
      value: `${overview.averagePassRate.toFixed(1)}%`,
      icon: CheckCircle2,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      title: "คะแนนเฉลี่ย",
      value: overview.averageScore.toFixed(1),
      icon: Shield,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            รายงานและวิเคราะห์
          </h1>
          <p className="text-sm text-muted-foreground">
            สถิติภาพรวมและการวิเคราะห์ผลสอบ
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <FileDown className="h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <FileDown className="h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <FileDown className="h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
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
      )}

      {/* Charts Row 1: Score Distribution + Pass/Fail Pie */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Score Distribution Bar Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">การกระจายคะแนน</CardTitle>
            <CardDescription>
              กระจายตัวของคะแนนผู้สอบทั้งหมด ({scoreDist?.total ?? 0} คน)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {scoreDistData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={scoreDistData}
                    margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="range"
                      tick={{ fontSize: 11 }}
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
                      formatter={(value: number) => [`${value} คน`, "จำนวน"]}
                    />
                    <Bar
                      dataKey="count"
                      name="จำนวนผู้สอบ"
                      fill="oklch(0.34 0.13 25)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  ยังไม่มีข้อมูลคะแนน
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pass/Fail Pie Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">อัตราผ่าน/ไม่ผ่าน</CardTitle>
            <CardDescription>สัดส่วนรวมทุกชุดสอบ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {overview.passCount + overview.failCount > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [`${value} คน`, "จำนวน"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  ยังไม่มีข้อมูล
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">แนวโน้มรายเดือน</CardTitle>
          <CardDescription>
            จำนวนผู้เข้าสอบและอัตราผ่าน 12 เดือนล่าสุด
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            {trendData.some((t) => t.candidates > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 5, right: 30, left: -10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
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
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="candidates"
                    name="ผู้เข้าสอบ"
                    stroke="oklch(0.34 0.13 25)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="passRate"
                    name="อัตราผ่าน (%)"
                    stroke="oklch(0.55 0.15 145)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                ยังไม่มีข้อมูลแนวโน้ม
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
