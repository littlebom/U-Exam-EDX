"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Clock,
  CheckCircle2,
  UserX,
  Loader2,
  Search,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Candidate {
  id: string;
  name: string;
  email: string;
  registrationId: string;
  sessionId: string | null;
  status: "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT" | "ABSENT";
  startedAt: string | null;
  submittedAt: string | null;
  score: number | null;
  isPassed: boolean | null;
}

interface TrackingDetail {
  schedule: {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    exam: { id: string; title: string; duration: number; passingScore: number | null };
    testCenter: { id: string; name: string } | null;
  };
  stats: {
    registered: number;
    inProgress: number;
    submitted: number;
    absent: number;
  };
  candidates: Candidate[];
}

const STATUS_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "IN_PROGRESS", label: "กำลังสอบ" },
  { value: "SUBMITTED", label: "สอบเสร็จ" },
  { value: "ABSENT", label: "ไม่มาสอบ" },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "IN_PROGRESS":
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 gap-1"><Clock className="h-3 w-3" /> กำลังสอบ</Badge>;
    case "SUBMITTED":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1"><CheckCircle2 className="h-3 w-3" /> สอบเสร็จ</Badge>;
    case "TIMED_OUT":
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 gap-1"><Clock className="h-3 w-3" /> หมดเวลา</Badge>;
    case "ABSENT":
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 gap-1"><UserX className="h-3 w-3" /> ไม่มาสอบ</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function TrackingDetailPage({ params }: { params: Promise<{ scheduleId: string }> }) {
  const { scheduleId } = use(params);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  const { data: result, isLoading } = useQuery<{ data: TrackingDetail }>({
    queryKey: ["exam-tracking", scheduleId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/exams/tracking/${scheduleId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const detail = result?.data;
  const candidates = detail?.candidates ?? [];

  // Filter
  const filtered = candidates.filter((c) => {
    if (filterStatus !== "all") {
      if (filterStatus === "SUBMITTED" && c.status !== "SUBMITTED" && c.status !== "TIMED_OUT") return false;
      if (filterStatus !== "SUBMITTED" && c.status !== filterStatus) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!detail) {
    return <div className="text-center py-16 text-muted-foreground">ไม่พบข้อมูลรอบสอบ</div>;
  }

  const { schedule, stats } = detail;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/admin/exams/tracking">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{schedule.exam.title}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(schedule.startDate).toLocaleDateString("th-TH", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            {schedule.testCenter && <span>📍 {schedule.testCenter.name}</span>}
            <span>⏱ {schedule.exam.duration} นาที</span>
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">ลงทะเบียน</span>
              </div>
              <span className="text-2xl font-bold">{stats.registered}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">กำลังสอบ</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{stats.inProgress}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">สอบเสร็จ</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.submitted}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-red-600" />
                <span className="text-sm text-muted-foreground">ไม่มาสอบ</span>
              </div>
              <span className="text-2xl font-bold text-red-600">{stats.absent}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อหรืออีเมล..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Candidates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายชื่อผู้สอบ</CardTitle>
          <CardDescription>
            แสดง {filtered.length} จาก {candidates.length} คน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ</TableHead>
                <TableHead>อีเมล</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>เวลาเริ่ม</TableHead>
                <TableHead>เวลาส่ง</TableHead>
                <TableHead className="text-right">คะแนน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    ไม่พบข้อมูล
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{c.email}</TableCell>
                    <TableCell>{getStatusBadge(c.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.startedAt
                        ? new Date(c.startedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.submittedAt
                        ? new Date(c.submittedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.score !== null ? (
                        <span className={c.isPassed ? "text-green-600 font-medium" : "text-red-600"}>
                          {c.score}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
