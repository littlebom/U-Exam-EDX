"use client";

import { useState } from "react";
import { GitCompareArrows, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useSimpleList } from "@/hooks/use-api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ExamOption {
  id: string;
  title: string;
}

interface OverviewStats {
  totalExams: number;
  totalCandidates: number;
  averagePassRate: number;
  averageScore: number;
  passCount: number;
  failCount: number;
  highestScore: number;
  lowestScore: number;
}

const NONE_VALUE = "__none__";

export default function CompareAnalyticsPage() {
  const [examA, setExamA] = useState("");
  const [examB, setExamB] = useState("");

  const { data: exams } = useSimpleList<ExamOption>("exams", "/api/v1/exams");

  const { data: dataA, isLoading: loadingA } = useQuery<{ data: OverviewStats }>({
    queryKey: ["compare-a", examA],
    queryFn: async () => {
      const res = await fetch(`/api/v1/analytics/overview?examId=${examA}`);
      return res.json();
    },
    enabled: !!examA,
  });

  const { data: dataB, isLoading: loadingB } = useQuery<{ data: OverviewStats }>({
    queryKey: ["compare-b", examB],
    queryFn: async () => {
      const res = await fetch(`/api/v1/analytics/overview?examId=${examB}`);
      return res.json();
    },
    enabled: !!examB,
  });

  const statsA = dataA?.data;
  const statsB = dataB?.data;
  const examATitle = (exams ?? []).find((e) => e.id === examA)?.title ?? "วิชา A";
  const examBTitle = (exams ?? []).find((e) => e.id === examB)?.title ?? "วิชา B";

  const bothSelected = !!examA && !!examB && !!statsA && !!statsB;

  const chartData = bothSelected
    ? [
        {
          metric: "ผู้เข้าสอบ",
          [examATitle]: statsA.totalCandidates,
          [examBTitle]: statsB.totalCandidates,
        },
        {
          metric: "ผ่าน",
          [examATitle]: statsA.passCount,
          [examBTitle]: statsB.passCount,
        },
        {
          metric: "ไม่ผ่าน",
          [examATitle]: statsA.failCount,
          [examBTitle]: statsB.failCount,
        },
      ]
    : [];

  const compareRows = bothSelected
    ? [
        { label: "ผู้เข้าสอบ", a: statsA.totalCandidates, b: statsB.totalCandidates, suffix: " คน" },
        { label: "อัตราผ่าน", a: statsA.averagePassRate, b: statsB.averagePassRate, suffix: "%", fixed: 1 },
        { label: "คะแนนเฉลี่ย", a: statsA.averageScore, b: statsB.averageScore, suffix: "%", fixed: 1 },
        { label: "คะแนนสูงสุด", a: statsA.highestScore, b: statsB.highestScore, suffix: "%", fixed: 1 },
        { label: "คะแนนต่ำสุด", a: statsA.lowestScore, b: statsB.lowestScore, suffix: "%", fixed: 1 },
        { label: "ผ่าน", a: statsA.passCount, b: statsB.passCount, suffix: " คน" },
        { label: "ไม่ผ่าน", a: statsA.failCount, b: statsB.failCount, suffix: " คน" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <GitCompareArrows className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">เปรียบเทียบวิชา</h1>
          <p className="text-sm text-muted-foreground">
            เปรียบเทียบสถิติผลสอบระหว่าง 2 วิชา
          </p>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>วิชา A</Label>
          <Select
            value={examA || NONE_VALUE}
            onValueChange={(v) => setExamA(v === NONE_VALUE ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกวิชา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>— เลือกวิชา —</SelectItem>
              {(exams ?? []).map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>วิชา B</Label>
          <Select
            value={examB || NONE_VALUE}
            onValueChange={(v) => setExamB(v === NONE_VALUE ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกวิชา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>— เลือกวิชา —</SelectItem>
              {(exams ?? []).map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {(loadingA || loadingB) && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!bothSelected && !loadingA && !loadingB && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitCompareArrows className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              เลือก 2 วิชาเพื่อเปรียบเทียบสถิติ
            </p>
          </CardContent>
        </Card>
      )}

      {bothSelected && (
        <>
          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ตารางเปรียบเทียบ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left font-medium text-muted-foreground">สถิติ</th>
                      <th className="py-2 text-right font-medium" style={{ color: "oklch(0.34 0.13 25)" }}>
                        {examATitle}
                      </th>
                      <th className="py-2 text-right font-medium" style={{ color: "oklch(0.55 0.15 145)" }}>
                        {examBTitle}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareRows.map((row) => {
                      const valA = row.fixed != null ? row.a.toFixed(row.fixed) : row.a;
                      const valB = row.fixed != null ? row.b.toFixed(row.fixed) : row.b;
                      return (
                        <tr key={row.label} className="border-b last:border-0">
                          <td className="py-2.5 text-muted-foreground">{row.label}</td>
                          <td className={cn("py-2.5 text-right font-medium", row.a > row.b && "text-green-600")}>
                            {valA}{row.suffix}
                          </td>
                          <td className={cn("py-2.5 text-right font-medium", row.b > row.a && "text-green-600")}>
                            {valB}{row.suffix}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">กราฟเปรียบเทียบ</CardTitle>
              <CardDescription>จำนวนผู้เข้าสอบ ผ่าน และไม่ผ่าน</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey={examATitle}
                      fill="oklch(0.34 0.13 25)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey={examBTitle}
                      fill="oklch(0.55 0.15 145)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
