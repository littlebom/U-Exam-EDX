"use client";

import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  CheckCircle2,
  Loader2,
} from "lucide-react";
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── Types ──────────────────────────────────────────────────────────

interface TrendItem {
  month: string;
  label: string;
  totalExams: number;
  totalCandidates: number;
  averagePassRate: number;
  averageScore: number;
}

interface TrendData {
  trends: TrendItem[];
}

export default function TrendsPage() {
  const { data: trendResult, isLoading } = useDetail<TrendData>(
    "analytics-trends-page",
    "/api/v1/analytics/trends"
  );

  const trends = trendResult?.trends ?? [];
  const chartData = trends.map((t) => ({
    label: t.label,
    passRate: t.averagePassRate,
    avgScore: t.averageScore,
  }));

  // Calculate summary stats
  const latestMonth = trends.length > 0 ? trends[trends.length - 1] : null;
  const previousMonth = trends.length > 1 ? trends[trends.length - 2] : null;

  const passRateTrend =
    latestMonth && previousMonth
      ? latestMonth.averagePassRate - previousMonth.averagePassRate
      : 0;
  const scoreTrend =
    latestMonth && previousMonth
      ? latestMonth.averageScore - previousMonth.averageScore
      : 0;

  const overallAvgScore =
    trends.length > 0
      ? trends.reduce((sum, t) => sum + t.averageScore, 0) / trends.length
      : 0;

  const overallAvgPassRate =
    trends.length > 0
      ? trends.reduce((sum, t) => sum + t.averagePassRate, 0) / trends.length
      : 0;

  const summaryCards = [
    {
      title: "แนวโน้มอัตราผ่าน",
      value: `${passRateTrend > 0 ? "+" : ""}${passRateTrend.toFixed(1)}%`,
      description: "เทียบเดือนก่อนหน้า",
      isPositive: passRateTrend >= 0,
      icon: passRateTrend >= 0 ? TrendingUp : TrendingDown,
    },
    {
      title: "แนวโน้มคะแนน",
      value: `${scoreTrend > 0 ? "+" : ""}${scoreTrend.toFixed(1)}`,
      description: "เทียบเดือนก่อนหน้า",
      isPositive: scoreTrend >= 0,
      icon: scoreTrend >= 0 ? TrendingUp : TrendingDown,
    },
    {
      title: "คะแนนเฉลี่ย",
      value: overallAvgScore.toFixed(1),
      description: `เฉลี่ย ${trends.length} เดือน`,
      isPositive: true,
      icon: BarChart3,
    },
    {
      title: "อัตราผ่านเฉลี่ย",
      value: `${overallAvgPassRate.toFixed(1)}%`,
      description: `เฉลี่ย ${trends.length} เดือน`,
      isPositive: true,
      icon: CheckCircle2,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">แนวโน้มผลสอบ</h1>
          <p className="text-sm text-muted-foreground">
            แนวโน้มอัตราผ่านและคะแนนเฉลี่ย 12 เดือนล่าสุด
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                {card.title}
              </CardDescription>
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md",
                  card.isPositive
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
                )}
              >
                <card.icon
                  className={cn(
                    "h-4 w-4",
                    card.isPositive ? "text-green-600" : "text-red-600"
                  )}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "text-2xl font-bold",
                  card.title.includes("แนวโน้ม") &&
                    (card.isPositive ? "text-green-600" : "text-red-600")
                )}
              >
                {card.value}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dual Y-Axis Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            อัตราผ่านและคะแนนเฉลี่ยรายเดือน
          </CardTitle>
          <CardDescription>
            แสดงแนวโน้ม 12 เดือนล่าสุด
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            {chartData.some((d) => d.passRate > 0 || d.avgScore > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
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
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    label={{
                      value: "อัตราผ่าน (%)",
                      angle: -90,
                      position: "insideLeft",
                      offset: 20,
                      style: { fontSize: 11 },
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    label={{
                      value: "คะแนนเฉลี่ย",
                      angle: 90,
                      position: "insideRight",
                      offset: 20,
                      style: { fontSize: 11 },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ fontWeight: 600 }}
                    formatter={(value: number, name: string) => {
                      if (name === "อัตราผ่าน (%)") return [`${value}%`, name];
                      return [value.toFixed(1), name];
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="passRate"
                    name="อัตราผ่าน (%)"
                    stroke="oklch(0.34 0.13 25)"
                    strokeWidth={2.5}
                    dot={{ fill: "oklch(0.34 0.13 25)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgScore"
                    name="คะแนนเฉลี่ย"
                    stroke="oklch(0.55 0.15 145)"
                    strokeWidth={2.5}
                    dot={{ fill: "oklch(0.55 0.15 145)", r: 4 }}
                    activeDot={{ r: 6 }}
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
