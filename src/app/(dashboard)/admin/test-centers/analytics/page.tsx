"use client";

import { useState } from "react";
import {
  Loader2,
  Building2,
  DoorOpen,
  Armchair,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Users,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSimpleList } from "@/hooks/use-api";
import { useQuery } from "@tanstack/react-query";
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
} from "recharts";

// ─── Types ──────────────────────────────────────────────────────────

interface OverviewData {
  totalCenters: number;
  activeCenters: number;
  maintenanceCenters: number;
  inactiveCenters: number;
  totalRooms: number;
  totalSeats: number;
  totalEquipment: number;
  workingEquipment: number;
  equipmentHealthRate: number;
  pendingApprovals: number;
}

interface CenterOption {
  id: string;
  name: string;
}

interface CenterDetailData {
  utilization: {
    totalSeats: number;
    totalSessions: number;
    totalRegistrations: number;
    totalCheckIns: number;
    incidentCount: number;
    rooms: { total: number; available: number; utilizationRate: number };
    seatUtilizationRate: number;
  };
  examHistory: Array<{
    id: string;
    examTitle: string;
    startDate: string;
    endDate: string;
    status: string;
    registrations: number;
    maxCandidates: number;
  }>;
  staffPerformance: Array<{
    id: string;
    user: { id: string; name: string; email: string };
    position: string;
    status: string;
    totalShifts: number;
  }>;
}

const PIE_COLORS = ["#16a34a", "#f59e0b", "#6b7280"];

// ─── Page ───────────────────────────────────────────────────────────

export default function CenterAnalyticsPage() {
  const [selectedCenterId, setSelectedCenterId] = useState("");

  const { data: testCenters } = useSimpleList<CenterOption>(
    "test-centers-list",
    "/api/v1/test-centers"
  );

  // Overview data
  const { data: overview, isLoading: isOverviewLoading } = useQuery<OverviewData>({
    queryKey: ["center-analytics-overview"],
    queryFn: async () => {
      const res = await fetch("/api/v1/center-analytics");
      const json = await res.json();
      return json.data;
    },
  });

  // Center-specific data
  const { data: centerDetail, isLoading: isCenterLoading } = useQuery<CenterDetailData>({
    queryKey: ["center-analytics-detail", selectedCenterId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/center-analytics/${selectedCenterId}`);
      const json = await res.json();
      return json.data;
    },
    enabled: !!selectedCenterId,
  });

  // Prepare chart data
  const centerStatusData = overview
    ? [
        { name: "ใช้งาน", value: overview.activeCenters },
        { name: "ซ่อมบำรุง", value: overview.maintenanceCenters },
        { name: "ไม่ใช้งาน", value: overview.inactiveCenters },
      ].filter((d) => d.value > 0)
    : [];

  const examHistoryChartData = centerDetail?.examHistory.slice(0, 10).map((e) => ({
    name: e.examTitle.length > 15 ? e.examTitle.slice(0, 15) + "…" : e.examTitle,
    registrations: e.registrations,
    capacity: e.maxCandidates,
  })) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">สถิติศูนย์สอบ</h1>
        <p className="text-sm text-muted-foreground">
          ภาพรวมและสถิติการใช้งานศูนย์สอบ
        </p>
      </div>

      {/* Overview Stats */}
      {isOverviewLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : overview ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ศูนย์สอบทั้งหมด</p>
                    <p className="text-2xl font-bold">{overview.totalCenters}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <DoorOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ห้องสอบ</p>
                    <p className="text-2xl font-bold">{overview.totalRooms}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Armchair className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ที่นั่งรวม</p>
                    <p className="text-2xl font-bold">{overview.totalSeats}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Wrench className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">อุปกรณ์</p>
                    <p className="text-2xl font-bold">
                      {overview.workingEquipment}/{overview.totalEquipment}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      สมบูรณ์ {overview.equipmentHealthRate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Center Status Pie */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">สถานะศูนย์สอบ</CardTitle>
                <CardDescription>จำนวนศูนย์สอบแบ่งตามสถานะ</CardDescription>
              </CardHeader>
              <CardContent>
                {centerStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={centerStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {centerStatusData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">ไม่มีข้อมูล</div>
                )}
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">สรุปภาพรวม</CardTitle>
                <CardDescription>ข้อมูลสำคัญของระบบศูนย์สอบ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    <span className="text-sm">ศูนย์สอบที่ใช้งาน</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    {overview.activeCenters} แห่ง
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <span className="text-sm">ศูนย์สอบซ่อมบำรุง</span>
                  </div>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    {overview.maintenanceCenters} แห่ง
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="text-sm">อัตราอุปกรณ์สมบูรณ์</span>
                  </div>
                  <span className="text-lg font-bold">{overview.equipmentHealthRate}%</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    <span className="text-sm">คำขออนุมัติรอดำเนินการ</span>
                  </div>
                  <Badge variant={overview.pendingApprovals > 0 ? "destructive" : "secondary"}>
                    {overview.pendingApprovals} รายการ
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {/* Per-Center Analytics */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">วิเคราะห์รายศูนย์สอบ</CardTitle>
              <CardDescription>เลือกศูนย์สอบเพื่อดูรายละเอียด</CardDescription>
            </div>
            <Select value={selectedCenterId} onValueChange={setSelectedCenterId}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="เลือกศูนย์สอบ" />
              </SelectTrigger>
              <SelectContent>
                {(testCenters ?? []).map((tc) => (
                  <SelectItem key={tc.id} value={tc.id}>
                    {tc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedCenterId ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BarChart3 className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm">เลือกศูนย์สอบเพื่อดูสถิติ</p>
            </div>
          ) : isCenterLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : centerDetail ? (
            <div className="space-y-6">
              {/* Utilization stats */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">ที่นั่ง</p>
                  <p className="text-xl font-bold">{centerDetail.utilization.totalSeats}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">ครั้งจัดสอบ</p>
                  <p className="text-xl font-bold">{centerDetail.utilization.totalSessions}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">ลงทะเบียน</p>
                  <p className="text-xl font-bold">{centerDetail.utilization.totalRegistrations}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">เช็คอิน</p>
                  <p className="text-xl font-bold">{centerDetail.utilization.totalCheckIns}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">อัตราใช้ที่นั่ง</p>
                  <p className="text-xl font-bold">{centerDetail.utilization.seatUtilizationRate}%</p>
                </div>
              </div>

              {/* Exam History Bar Chart */}
              {examHistoryChartData.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">ประวัติการจัดสอบ</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={examHistoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="registrations" name="ลงทะเบียน" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="capacity" name="ความจุ" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Staff performance table */}
              {centerDetail.staffPerformance.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    บุคลากร
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ชื่อ</TableHead>
                        <TableHead>ตำแหน่ง</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead className="text-right">จำนวนเวร</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {centerDetail.staffPerformance.map((sp) => (
                        <TableRow key={sp.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{sp.user.name}</p>
                              <p className="text-xs text-muted-foreground">{sp.user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{sp.position}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                sp.status === "ACTIVE"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {sp.status === "ACTIVE" ? "ปฏิบัติงาน" : sp.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {sp.totalShifts}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Exam History Table */}
              {centerDetail.examHistory.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">ประวัติการจัดสอบ (ล่าสุด)</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ชุดสอบ</TableHead>
                        <TableHead>วันที่</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead className="text-right">ลงทะเบียน</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {centerDetail.examHistory.map((exam) => (
                        <TableRow key={exam.id}>
                          <TableCell className="font-medium text-sm">{exam.examTitle}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(exam.startDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                exam.status === "COMPLETED"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : exam.status === "ACTIVE"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                  : ""
                              }
                            >
                              {exam.status === "COMPLETED" ? "เสร็จสิ้น" : exam.status === "ACTIVE" ? "กำลังดำเนินการ" : exam.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {exam.registrations}/{exam.maxCandidates}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
