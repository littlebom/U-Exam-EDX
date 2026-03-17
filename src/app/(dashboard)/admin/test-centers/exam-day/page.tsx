"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UserCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  CalendarCheck,
  Loader2,
  ScanLine,
  Plus,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────

interface Schedule {
  id: string;
  startDate: string;
  status: string;
  maxCandidates: number;
  exam: { id: string; title: string };
  _count: { registrations: number };
}

interface CheckInLog {
  id: string;
  type: string;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface Incident {
  id: string;
  description: string;
  severity: string | null;
  createdAt: string;
}

interface CheckInStatus {
  schedule: {
    id: string;
    examTitle: string;
    startDate: string;
    maxCandidates: number;
  };
  stats: {
    totalRegistered: number;
    checkedIn: number;
    lateCount: number;
    incidents: number;
    notCheckedIn: number;
  };
  recentCheckIns: CheckInLog[];
  incidents: Incident[];
}

interface AttendanceItem {
  id: string;
  candidateName: string;
  candidateEmail: string;
  seatNumber: string | null;
  status: string;
  checkedInAt: string | null;
}

interface ScanResult {
  status: "SUCCESS" | "LATE" | "ALREADY_CHECKED_IN" | "NOT_FOUND" | "ERROR";
  message: string;
  candidate?: { name: string; seatNumber: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

function getCheckInStatusBadge(type: string) {
  switch (type) {
    case "CHECKIN":
      return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="mr-1 h-3 w-3" />สำเร็จ</Badge>;
    case "LATE_CHECKIN":
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="mr-1 h-3 w-3" />มาสาย</Badge>;
    case "CHECKIN_FAILED":
      return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><XCircle className="mr-1 h-3 w-3" />ไม่ผ่าน</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

function getSeverityStyle(severity: string | null) {
  switch (severity) {
    case "HIGH":
      return { border: "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20", icon: "text-red-600", badge: "border-red-300 text-red-700", label: "สูง" };
    case "MEDIUM":
      return { border: "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20", icon: "text-amber-600", badge: "border-amber-300 text-amber-700", label: "ปานกลาง" };
    default:
      return { border: "border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/20", icon: "text-blue-600", badge: "border-blue-300 text-blue-700", label: "ต่ำ" };
  }
}

// ─── Component ───────────────────────────────────────────────────────

export default function ExamDayPage() {
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  // Voucher scan state
  const [voucherCode, setVoucherCode] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Incident dialog state
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [incidentDescription, setIncidentDescription] = useState("");
  const [incidentSeverity, setIncidentSeverity] = useState("LOW");
  const [isReporting, setIsReporting] = useState(false);

  const queryClient = useQueryClient();

  // Fetch today's schedules
  const { data: schedulesData } = useQuery<{ data: Schedule[] }>({
    queryKey: ["checkin-schedules"],
    queryFn: async () => {
      const res = await fetch("/api/v1/checkin/schedules");
      if (!res.ok) throw new Error("Failed to fetch schedules");
      return res.json();
    },
  });
  const schedules = schedulesData?.data ?? [];
  const activeScheduleId = selectedScheduleId || schedules[0]?.id || "";

  // Fetch check-in status
  const { data: statusData } = useQuery<{ data: CheckInStatus }>({
    queryKey: ["checkin-status", activeScheduleId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/checkin/status/${activeScheduleId}`);
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
    enabled: !!activeScheduleId,
    refetchInterval: 15000,
  });

  // Fetch attendance
  const { data: attendanceData } = useQuery<{ data: AttendanceItem[] }>({
    queryKey: ["checkin-attendance", activeScheduleId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/checkin/attendance/${activeScheduleId}`);
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
    enabled: !!activeScheduleId && activeTab === "attendance",
    refetchInterval: 30000,
  });

  const status = statusData?.data;
  const stats = status?.stats;
  const checkedIn = stats?.checkedIn ?? 0;
  const total = stats?.totalRegistered ?? 0;
  const checkInPercent = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
  const attendance = attendanceData?.data ?? [];

  // Handle voucher scan
  const handleScan = async () => {
    if (!voucherCode.trim() || !activeScheduleId) return;
    setIsScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/v1/checkin/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucherCode: voucherCode.trim(), examScheduleId: activeScheduleId }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setScanResult({ status: "SUCCESS", message: json.data?.message || "เช็คอินสำเร็จ", candidate: json.data?.candidate });
        toast.success("เช็คอินสำเร็จ");
        queryClient.invalidateQueries({ queryKey: ["checkin-status", activeScheduleId] });
      } else {
        setScanResult({ status: json.data?.status || "ERROR", message: json.error || "เกิดข้อผิดพลาด" });
      }
    } catch {
      setScanResult({ status: "ERROR", message: "เกิดข้อผิดพลาด" });
    } finally {
      setIsScanning(false);
      setVoucherCode("");
    }
  };

  // Handle incident report
  const handleReportIncident = async () => {
    if (!incidentDescription.trim() || !activeScheduleId) return;
    setIsReporting(true);
    try {
      const res = await fetch("/api/v1/checkin/incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examScheduleId: activeScheduleId,
          type: "INCIDENT",
          description: incidentDescription.trim(),
          severity: incidentSeverity,
        }),
      });
      if (res.ok) {
        toast.success("รายงานเหตุการณ์สำเร็จ");
        setIncidentDialogOpen(false);
        setIncidentDescription("");
        setIncidentSeverity("LOW");
        queryClient.invalidateQueries({ queryKey: ["checkin-status", activeScheduleId] });
      } else {
        const json = await res.json();
        toast.error(json.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">วันสอบ — Dashboard</h1>
          <p className="text-sm text-muted-foreground">ติดตามสถานะการสอบแบบ Real-time</p>
        </div>
        <div className="flex items-center gap-2">
          {schedules.length > 0 && (
            <Select value={activeScheduleId} onValueChange={setSelectedScheduleId}>
              <SelectTrigger className="w-full sm:w-[320px]">
                <SelectValue placeholder="เลือกรอบสอบ" />
              </SelectTrigger>
              <SelectContent>
                {schedules.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                      <span>{s.exam.title}</span>
                      <span className="text-muted-foreground">({formatTime(s.startDate)})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Empty State */}
      {schedules.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarCheck className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">ไม่มีรอบสอบวันนี้</h3>
            <p className="mt-1 text-sm text-muted-foreground">ไม่มีรอบสอบที่กำหนดไว้สำหรับวันนี้</p>
          </CardContent>
        </Card>
      )}

      {status && (
        <>
          {/* Voucher Scan */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ScanLine className="h-4 w-4" />
                สแกน Voucher เช็คอิน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="พิมพ์หรือสแกนรหัส Voucher..."
                  className="max-w-sm"
                  onKeyDown={(e) => { if (e.key === "Enter") handleScan(); }}
                />
                <Button onClick={handleScan} disabled={isScanning || !voucherCode.trim()} className="gap-1.5">
                  {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
                  สแกน
                </Button>
                <Button variant="outline" onClick={() => setIncidentDialogOpen(true)} className="gap-1.5 ml-auto">
                  <Plus className="h-4 w-4" />
                  รายงานเหตุการณ์
                </Button>
              </div>

              {/* Scan Result */}
              {scanResult && (
                <div className={cn(
                  "mt-3 rounded-lg border p-3",
                  scanResult.status === "SUCCESS" && "border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/20",
                  scanResult.status === "LATE" && "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20",
                  scanResult.status === "ALREADY_CHECKED_IN" && "border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/20",
                  (scanResult.status === "NOT_FOUND" || scanResult.status === "ERROR") && "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20",
                )}>
                  <div className="flex items-center gap-2">
                    {scanResult.status === "SUCCESS" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    {scanResult.status === "LATE" && <Clock className="h-5 w-5 text-amber-600" />}
                    {scanResult.status === "ALREADY_CHECKED_IN" && <UserCheck className="h-5 w-5 text-blue-600" />}
                    {(scanResult.status === "NOT_FOUND" || scanResult.status === "ERROR") && <XCircle className="h-5 w-5 text-red-600" />}
                    <span className="font-medium text-sm">{scanResult.message}</span>
                  </div>
                  {scanResult.candidate && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {scanResult.candidate.name} — ที่นั่ง {scanResult.candidate.seatNumber}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs: Dashboard / Attendance */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="dashboard" className="gap-1.5"><UserCheck className="h-3.5 w-3.5" />สรุป</TabsTrigger>
              <TabsTrigger value="attendance" className="gap-1.5"><List className="h-3.5 w-3.5" />รายชื่อ</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription className="text-sm font-medium">Check-in</CardDescription>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/30"><UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" /></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{checkedIn}/{total}</div>
                    <Progress value={checkInPercent} className="mt-2" />
                    <p className="mt-1 text-xs text-muted-foreground">{checkInPercent}% เช็คอินแล้ว</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription className="text-sm font-medium">ยังไม่เช็คอิน</CardDescription>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100 dark:bg-orange-900/30"><Users className="h-4 w-4 text-orange-600 dark:text-orange-400" /></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.notCheckedIn ?? 0}</div>
                    <p className="mt-1 text-xs text-muted-foreground">ผู้สอบที่ยังไม่มา ({stats?.lateCount ?? 0} มาสาย)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription className="text-sm font-medium">เหตุการณ์</CardDescription>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30"><AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.incidents ?? 0}</div>
                    <p className="mt-1 text-xs text-muted-foreground">เหตุการณ์ที่ต้องดูแล</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription className="text-sm font-medium">เวลาเริ่มสอบ</CardDescription>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10"><Clock className="h-4 w-4 text-primary" /></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatTime(status.schedule.startDate)}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{status.schedule.examTitle}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-5">
                {/* Recent Check-in */}
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="text-base">การเช็คอินล่าสุด</CardTitle>
                    <CardDescription>รายการเช็คอินล่าสุด 10 คน</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {status.recentCheckIns.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-muted-foreground">
                        <UserCheck className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">ยังไม่มีการเช็คอิน</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>เวลา</TableHead>
                            <TableHead>ชื่อ</TableHead>
                            <TableHead>ที่นั่ง</TableHead>
                            <TableHead>สถานะ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {status.recentCheckIns.map((ci) => {
                            const meta = ci.metadata as Record<string, unknown> | null;
                            return (
                              <TableRow key={ci.id}>
                                <TableCell className="font-mono text-sm">{formatTime(ci.createdAt)}</TableCell>
                                <TableCell className="font-medium">{(meta?.candidateName as string) ?? "-"}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{(meta?.seatNumber as string) ?? "-"}</TableCell>
                                <TableCell>{getCheckInStatusBadge(ci.type)}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Incidents */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">เหตุการณ์</CardTitle>
                    <CardDescription>เหตุการณ์ที่ต้องดูแลวันนี้</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {status.incidents.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">ไม่มีเหตุการณ์</p>
                      </div>
                    ) : (
                      status.incidents.map((incident) => {
                        const style = getSeverityStyle(incident.severity);
                        return (
                          <div key={incident.id} className={cn("rounded-lg border p-3", style.border)}>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={cn("h-4 w-4", style.icon)} />
                              <span className="text-xs font-medium text-muted-foreground">{formatTime(incident.createdAt)}</span>
                              <Badge variant="outline" className={cn("text-xs", style.badge)}>{style.label}</Badge>
                            </div>
                            <p className="mt-2 text-sm">{incident.description}</p>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Attendance Tab */}
            <TabsContent value="attendance">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">รายชื่อผู้สอบ ({attendance.length})</CardTitle>
                  <CardDescription>รายชื่อผู้ลงทะเบียนและสถานะเช็คอิน</CardDescription>
                </CardHeader>
                <CardContent>
                  {attendance.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-muted-foreground">
                      <Users className="h-10 w-10 mb-3 opacity-50" />
                      <p className="font-medium">ยังไม่มีผู้ลงทะเบียน</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ชื่อ</TableHead>
                          <TableHead>อีเมล</TableHead>
                          <TableHead>ที่นั่ง</TableHead>
                          <TableHead>สถานะ</TableHead>
                          <TableHead>เวลาเช็คอิน</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendance.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">{a.candidateName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{a.candidateEmail}</TableCell>
                            <TableCell className="text-sm">{a.seatNumber ?? "—"}</TableCell>
                            <TableCell>
                              {a.status === "CHECKED_IN" ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">เช็คอินแล้ว</Badge>
                              ) : (
                                <Badge variant="outline">ยังไม่เช็คอิน</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {a.checkedInAt ? formatTime(a.checkedInAt) : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Incident Report Dialog */}
      <Dialog open={incidentDialogOpen} onOpenChange={setIncidentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>รายงานเหตุการณ์</DialogTitle>
            <DialogDescription>บันทึกเหตุการณ์ที่เกิดขึ้นระหว่างการสอบ</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>ระดับความรุนแรง</Label>
              <Select value={incidentSeverity} onValueChange={setIncidentSeverity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">ต่ำ</SelectItem>
                  <SelectItem value="MEDIUM">ปานกลาง</SelectItem>
                  <SelectItem value="HIGH">สูง</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>รายละเอียด <span className="text-destructive">*</span></Label>
              <Textarea
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                rows={3}
                placeholder="อธิบายเหตุการณ์ที่เกิดขึ้น..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIncidentDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleReportIncident} disabled={isReporting || !incidentDescription.trim()} className="gap-1.5">
              {isReporting && <Loader2 className="h-4 w-4 animate-spin" />}
              รายงาน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
