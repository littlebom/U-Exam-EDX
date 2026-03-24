"use client";

import { useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Loader2, BookOpen } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface CompetencyItem {
  id: string;
  name: string;
  shortName?: string;
  color: string | null;
  score: number;
  maxScore: number;
  percentage: number;
  questionCount: number;
}

interface FrameworkOption {
  id: string;
  name: string;
  description: string | null;
  areas: Array<{ id: string; name: string; color: string | null }>;
}

function shortenName(name: string, maxLen = 20): string {
  if (name.length <= maxLen) return name;
  let short = name
    .replace("Development", "Dev")
    .replace("Management", "Mgmt")
    .replace("Specialized", "Spec.")
    .replace("Technical", "Tech")
    .replace("Fundamentals", "Fund.");
  if (short.length <= maxLen) return short;
  return short.slice(0, maxLen - 2) + "..";
}

const CHART_STROKE = "#4f6af0";
const CHART_FILL = "#a8b8f8";
const BAR_COLOR = "#4f6af0";
const BAR_BG = "#e5e7eb";
const SCORE_COLOR = "#3b4fd4";

export function CompetencyRadarChart() {
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>("");

  const { data: frameworksData, isLoading: isLoadingFrameworks } = useQuery<{
    frameworks: FrameworkOption[];
  }>({
    queryKey: ["profile-competency-frameworks"],
    queryFn: async () => {
      const res = await fetch("/api/v1/profile/competency");
      if (!res.ok) return { frameworks: [] as FrameworkOption[] };
      const json = await res.json();
      return json.data ?? { frameworks: [] as FrameworkOption[] };
    },
  });

  const frameworks = frameworksData?.frameworks ?? [];
  const activeFrameworkId = selectedFrameworkId || frameworks[0]?.id || "";

  const { data: scoreData, isLoading: isLoadingScores } = useQuery<{
    framework: { id: string; name: string; description: string | null };
    competencies: CompetencyItem[];
  }>({
    queryKey: ["profile-competency-scores", activeFrameworkId],
    queryFn: async () => {
      const res = await fetch(
        `/api/v1/profile/competency?frameworkId=${activeFrameworkId}`
      );
      if (!res.ok) return { framework: null, competencies: [] };
      const json = await res.json();
      return json.data ?? { framework: null, competencies: [] };
    },
    enabled: !!activeFrameworkId,
  });

  const competencies = scoreData?.competencies ?? [];
  const hasData = competencies.some((c) => c.questionCount > 0);

  const chartData = competencies.map((c) => ({
    name: shortenName(c.name),
    fullName: c.name,
    score: c.percentage,
    fullMark: 100,
  }));

  if (isLoadingFrameworks) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (frameworks.length === 0) {
    return null;
  }

  const showTabs = frameworks.length > 1;

  return (
    <Card className="overflow-hidden">
      {/* Tabs — show when multiple frameworks */}
      {showTabs && (
        <div className="px-6 pb-4">
          <div className="flex rounded-lg bg-muted p-1">
            {frameworks.map((fw) => (
              <button
                key={fw.id}
                onClick={() => setSelectedFrameworkId(fw.id)}
                className={cn(
                  "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all",
                  activeFrameworkId === fw.id
                    ? "bg-background text-foreground shadow-sm border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {fw.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <CardContent className={cn("pb-6", showTabs ? "pt-0" : "pt-0")}>
        {isLoadingScores ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BookOpen className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">ยังไม่มีข้อมูลสมรรถนะ</p>
            <p className="text-xs mt-1">ข้อมูลจะแสดงเมื่อมีผลสอบที่ผูกกับกรอบสมรรถนะ</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Radar Chart */}
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid
                    stroke="#d1d5db"
                    strokeDasharray="4 4"
                    gridType="polygon"
                  />
                  <PolarAngleAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fontWeight: 600, fill: "#374151" }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    tickCount={6}
                    axisLine={false}
                  />
                  <Radar
                    name="คะแนน"
                    dataKey="score"
                    stroke={CHART_STROKE}
                    fill={CHART_FILL}
                    fillOpacity={0.45}
                    strokeWidth={2}
                    dot={{
                      r: 3.5,
                      fill: CHART_STROKE,
                      stroke: "#fff",
                      strokeWidth: 1.5,
                    }}
                    activeDot={{
                      r: 5,
                      fill: CHART_STROKE,
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "คะแนน"]}
                    contentStyle={{
                      borderRadius: "8px",
                      fontSize: "13px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#fff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Score breakdown */}
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 px-1">
              {competencies.map((c) => (
                <div key={c.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate pr-2">
                      {c.name}
                    </p>
                    <span
                      className="text-xs tabular-nums shrink-0"
                      style={{ color: SCORE_COLOR }}
                    >
                      {c.questionCount > 0 ? c.percentage : "—"}
                    </span>
                  </div>
                  <div
                    className="h-1.5 w-full rounded-full overflow-hidden"
                    style={{ backgroundColor: BAR_BG }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${c.questionCount > 0 ? c.percentage : 0}%`,
                        backgroundColor: BAR_COLOR,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
