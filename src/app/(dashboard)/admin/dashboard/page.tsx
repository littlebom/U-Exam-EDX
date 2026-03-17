"use client";

import Link from "next/link";
import {
  FileText,
  Users,
  TrendingUp,
  Banknote,
  Plus,
  ClipboardList,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// --- Mock Data ---

const summaryCards = [
  {
    title: "จำนวนสอบทั้งหมด",
    value: "24",
    change: "+3",
    changeType: "increase" as const,
    description: "จากเดือนที่แล้ว",
    icon: FileText,
  },
  {
    title: "ผู้สมัครสอบ",
    value: "1,250",
    change: "+180",
    changeType: "increase" as const,
    description: "จากเดือนที่แล้ว",
    icon: Users,
  },
  {
    title: "อัตราผ่านสอบ",
    value: "78.5%",
    change: "+2.1%",
    changeType: "increase" as const,
    description: "จากเดือนที่แล้ว",
    icon: TrendingUp,
  },
  {
    title: "รายได้",
    value: "฿2.4M",
    change: "-5%",
    changeType: "decrease" as const,
    description: "จากเดือนที่แล้ว",
    icon: Banknote,
  },
];

const monthlyStats = [
  { month: "ต.ค.", exams: 18, candidates: 890, passed: 680 },
  { month: "พ.ย.", exams: 22, candidates: 1050, passed: 820 },
  { month: "ธ.ค.", exams: 15, candidates: 780, passed: 590 },
  { month: "ม.ค.", exams: 20, candidates: 1100, passed: 870 },
  { month: "ก.พ.", exams: 21, candidates: 1070, passed: 850 },
  { month: "มี.ค.", exams: 24, candidates: 1250, passed: 980 },
];

const recentActivity = [
  {
    id: "1",
    name: "สมศักดิ์ จันทร์ดี",
    action: "สมัครสอบ",
    exam: "IT Fundamentals",
    date: "10 มี.ค. 2569",
    status: "pending",
  },
  {
    id: "2",
    name: "วิไล สุขใจ",
    action: "ผ่านสอบ",
    exam: "CPA Certification",
    date: "9 มี.ค. 2569",
    status: "passed",
  },
  {
    id: "3",
    name: "ประยุทธ์ มั่นคง",
    action: "ไม่ผ่านสอบ",
    exam: "English Proficiency",
    date: "9 มี.ค. 2569",
    status: "failed",
  },
  {
    id: "4",
    name: "อารียา แก้วใส",
    action: "สมัครสอบ",
    exam: "PMP Certification",
    date: "8 มี.ค. 2569",
    status: "pending",
  },
  {
    id: "5",
    name: "ธนกร เจริญศรี",
    action: "ผ่านสอบ",
    exam: "IT Fundamentals",
    date: "8 มี.ค. 2569",
    status: "passed",
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "passed":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        >
          ผ่าน
        </Badge>
      );
    case "failed":
      return (
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        >
          ไม่ผ่าน
        </Badge>
      );
    case "pending":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
        >
          รอดำเนินการ
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function DashboardPage() {
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
          <Link href="/admin/analytics">
            <Button size="sm" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              ดูรายงาน
            </Button>
          </Link>
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
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <card.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                {card.changeType === "increase" ? (
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                )}
                <span
                  className={cn(
                    "font-medium",
                    card.changeType === "increase"
                      ? "text-green-600"
                      : "text-red-600"
                  )}
                >
                  {card.change}
                </span>
                <span className="text-muted-foreground">
                  {card.description}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Activity Table */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Bar Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">สถิติรายเดือน</CardTitle>
            <CardDescription>
              จำนวนผู้สมัครสอบและผู้ผ่านสอบ 6 เดือนล่าสุด
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyStats}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
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
                    name="ผู้สมัครสอบ"
                    fill="oklch(0.34 0.13 25)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="passed"
                    name="ผ่านสอบ"
                    fill="oklch(0.34 0.13 25 / 0.4)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">กิจกรรมล่าสุด</CardTitle>
            <CardDescription>
              การสมัครสอบและผลสอบล่าสุด
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">วันที่</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{activity.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {activity.exam}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(activity.status)}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {activity.date}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
