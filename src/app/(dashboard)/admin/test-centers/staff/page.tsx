"use client";

import { useState } from "react";
import {
  Plus,
  Loader2,
  Users,
  Pencil,
  Trash2,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useList, useSimpleList } from "@/hooks/use-api";
import {
  createCenterStaffAction,
  updateCenterStaffAction,
  deleteCenterStaffAction,
  createStaffShiftAction,
  updateStaffShiftAction,
  deleteStaffShiftAction,
} from "@/actions/center-staff.actions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────

interface StaffShiftPreview {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
}

interface StaffItem {
  id: string;
  position: string;
  status: string;
  phone: string | null;
  certifications: string[] | null;
  notes: string | null;
  user: { id: string; name: string; email: string; imageUrl: string | null; phone: string | null };
  testCenter: { id: string; name: string };
  shifts: StaffShiftPreview[];
}

interface TestCenterOption { id: string; name: string; }
interface UserOption { id: string; name: string | null; email: string; }

const POSITIONS = [
  { value: "PROCTOR", label: "ผู้คุมสอบ" },
  { value: "IT_SUPPORT", label: "IT Support" },
  { value: "RECEPTION", label: "ต้อนรับ" },
  { value: "ADMIN", label: "ผู้ดูแล" },
  { value: "COORDINATOR", label: "ผู้ประสานงาน" },
];

const STAFF_STATUSES = [
  { value: "ACTIVE", label: "ปฏิบัติงาน" },
  { value: "ON_LEAVE", label: "ลางาน" },
  { value: "INACTIVE", label: "ไม่ได้ปฏิบัติงาน" },
];

const SHIFT_ROLES = [
  { value: "PROCTOR", label: "ผู้คุมสอบ" },
  { value: "SUPPORT", label: "ผู้สนับสนุน" },
  { value: "ADMIN", label: "ผู้ดูแล" },
  { value: "COORDINATOR", label: "ผู้ประสานงาน" },
];

const SHIFT_STATUSES = [
  { value: "SCHEDULED", label: "กำหนดแล้ว" },
  { value: "IN_PROGRESS", label: "กำลังดำเนินการ" },
  { value: "COMPLETED", label: "เสร็จสิ้น" },
  { value: "CANCELLED", label: "ยกเลิก" },
];

const SHIFT_ROLE_LABELS: Record<string, string> = Object.fromEntries(SHIFT_ROLES.map((r) => [r.value, r.label]));

const POSITION_LABELS: Record<string, string> = Object.fromEntries(POSITIONS.map((p) => [p.value, p.label]));

interface ShiftItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
  status: string;
  notes: string | null;
  examScheduleId: string | null;
  examSchedule?: { id: string; exam?: { title: string } } | null;
}

// ─── Helpers ────────────────────────────────────────────────────────

function getPositionBadge(position: string) {
  const colors: Record<string, string> = {
    PROCTOR: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    IT_SUPPORT: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    RECEPTION: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    ADMIN: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    COORDINATOR: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  };
  return <Badge variant="secondary" className={colors[position] ?? ""}>{POSITION_LABELS[position] ?? position}</Badge>;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE": return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">ปฏิบัติงาน</Badge>;
    case "ON_LEAVE": return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">ลางาน</Badge>;
    case "INACTIVE": return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">ไม่ได้ปฏิบัติงาน</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

function formatNextShift(shifts: StaffShiftPreview[]) {
  if (!shifts || shifts.length === 0) return "—";
  const s = shifts[0];
  const dateStr = new Date(s.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  return `${dateStr} — ${s.startTime}`;
}

// ─── Page ───────────────────────────────────────────────────────────

export default function StaffPage() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPosition, setFilterPosition] = useState("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Shifts state
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [shiftEditTarget, setShiftEditTarget] = useState<ShiftItem | null>(null);
  const [shiftDeleteTarget, setShiftDeleteTarget] = useState<ShiftItem | null>(null);
  const [isShiftSubmitting, setIsShiftSubmitting] = useState(false);
  const [isShiftDeleting, setIsShiftDeleting] = useState(false);

  // Shift form state
  const [shiftDate, setShiftDate] = useState("");
  const [shiftStartTime, setShiftStartTime] = useState("08:00");
  const [shiftEndTime, setShiftEndTime] = useState("17:00");
  const [shiftRole, setShiftRole] = useState("PROCTOR");
  const [shiftStatus, setShiftStatus] = useState("SCHEDULED");
  const [shiftNotes, setShiftNotes] = useState("");

  // Form state
  const [formTestCenterId, setFormTestCenterId] = useState("");
  const [formUserId, setFormUserId] = useState("");
  const [formPosition, setFormPosition] = useState("PROCTOR");
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [formPhone, setFormPhone] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const queryClient = useQueryClient();

  const params: Record<string, string | number> = { page, perPage: 50 };
  if (filterStatus !== "all") params.status = filterStatus;
  if (filterPosition !== "all") params.position = filterPosition;

  const { data: result, isLoading } = useList<StaffItem>("center-staff", "/api/v1/center-staff", params);
  const staff = result?.data ?? [];
  const meta = result?.meta;

  const { data: testCenters } = useSimpleList<TestCenterOption>("test-centers-list", "/api/v1/test-centers");
  const { data: users } = useSimpleList<UserOption>("users-list", "/api/v1/users");

  // Fetch shifts for expanded staff
  const shiftParams: Record<string, string | number> = { perPage: 50 };
  if (expandedStaffId) shiftParams.centerStaffId = expandedStaffId;
  const { data: shiftResult, isLoading: isShiftsLoading } = useList<ShiftItem>(
    "staff-shifts",
    "/api/v1/staff-shifts",
    expandedStaffId ? shiftParams : { perPage: 0 }
  );
  const shifts = expandedStaffId ? (shiftResult?.data ?? []) : [];

  const activeCount = staff.filter((s) => s.status === "ACTIVE").length;
  const onLeaveCount = staff.filter((s) => s.status === "ON_LEAVE").length;
  const inactiveCount = staff.filter((s) => s.status === "INACTIVE").length;

  const resetForm = () => {
    setFormTestCenterId("");
    setFormUserId("");
    setFormPosition("PROCTOR");
    setFormStatus("ACTIVE");
    setFormPhone("");
    setFormNotes("");
  };

  const openCreate = () => { resetForm(); setEditTarget(null); setDialogOpen(true); };

  const openEdit = (item: StaffItem) => {
    setFormTestCenterId(item.testCenter.id);
    setFormUserId(item.user.id);
    setFormPosition(item.position);
    setFormStatus(item.status);
    setFormPhone(item.phone ?? "");
    setFormNotes(item.notes ?? "");
    setEditTarget(item);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!editTarget && (!formTestCenterId || !formUserId)) {
      toast.error("กรุณาเลือกศูนย์สอบและผู้ใช้");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = editTarget
        ? { position: formPosition, status: formStatus, phone: formPhone || undefined, notes: formNotes || undefined }
        : { testCenterId: formTestCenterId, userId: formUserId, position: formPosition, status: formStatus, phone: formPhone || undefined, notes: formNotes || undefined };

      const result = editTarget
        ? await updateCenterStaffAction(editTarget.id, payload)
        : await createCenterStaffAction(payload);

      if (result.success) {
        toast.success(editTarget ? "แก้ไขบุคลากรสำเร็จ" : "เพิ่มบุคลากรสำเร็จ");
        setDialogOpen(false);
        resetForm();
        setEditTarget(null);
        queryClient.invalidateQueries({ queryKey: ["center-staff"] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deleteCenterStaffAction(deleteTarget.id);
      if (result.success) {
        toast.success("ลบบุคลากรสำเร็จ");
        setDeleteTarget(null);
        queryClient.invalidateQueries({ queryKey: ["center-staff"] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Shift Handlers ──────────────────────────────────────────────

  const resetShiftForm = () => {
    setShiftDate("");
    setShiftStartTime("08:00");
    setShiftEndTime("17:00");
    setShiftRole("PROCTOR");
    setShiftStatus("SCHEDULED");
    setShiftNotes("");
  };

  const openCreateShift = () => {
    resetShiftForm();
    setShiftEditTarget(null);
    setShiftDialogOpen(true);
  };

  const openEditShift = (shift: ShiftItem) => {
    setShiftDate(shift.date.split("T")[0]);
    setShiftStartTime(shift.startTime);
    setShiftEndTime(shift.endTime);
    setShiftRole(shift.role);
    setShiftStatus(shift.status);
    setShiftNotes(shift.notes ?? "");
    setShiftEditTarget(shift);
    setShiftDialogOpen(true);
  };

  const handleShiftSubmit = async () => {
    if (!shiftDate || !shiftStartTime || !shiftEndTime) {
      toast.error("กรุณาระบุวันที่และเวลา");
      return;
    }
    setIsShiftSubmitting(true);
    try {
      const result = shiftEditTarget
        ? await updateStaffShiftAction(shiftEditTarget.id, {
            date: new Date(shiftDate),
            startTime: shiftStartTime,
            endTime: shiftEndTime,
            role: shiftRole,
            status: shiftStatus,
            notes: shiftNotes || undefined,
          })
        : await createStaffShiftAction({
            centerStaffId: expandedStaffId!,
            date: new Date(shiftDate),
            startTime: shiftStartTime,
            endTime: shiftEndTime,
            role: shiftRole,
            status: shiftStatus,
            notes: shiftNotes || undefined,
          });

      if (result.success) {
        toast.success(shiftEditTarget ? "แก้ไขกะงานสำเร็จ" : "เพิ่มกะงานสำเร็จ");
        setShiftDialogOpen(false);
        resetShiftForm();
        setShiftEditTarget(null);
        queryClient.invalidateQueries({ queryKey: ["staff-shifts"] });
        queryClient.invalidateQueries({ queryKey: ["center-staff"] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsShiftSubmitting(false);
    }
  };

  const handleShiftDelete = async () => {
    if (!shiftDeleteTarget) return;
    setIsShiftDeleting(true);
    try {
      const result = await deleteStaffShiftAction(shiftDeleteTarget.id);
      if (result.success) {
        toast.success("ลบกะงานสำเร็จ");
        setShiftDeleteTarget(null);
        queryClient.invalidateQueries({ queryKey: ["staff-shifts"] });
        queryClient.invalidateQueries({ queryKey: ["center-staff"] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsShiftDeleting(false);
    }
  };

  const toggleExpand = (staffId: string) => {
    setExpandedStaffId((prev) => (prev === staffId ? null : staffId));
  };

  const expandedStaffName = expandedStaffId
    ? staff.find((s) => s.id === expandedStaffId)?.user.name ?? ""
    : "";

  function getShiftStatusBadge(status: string) {
    switch (status) {
      case "SCHEDULED": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">กำหนดแล้ว</Badge>;
      case "IN_PROGRESS": return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">กำลังดำเนินการ</Badge>;
      case "COMPLETED": return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">เสร็จสิ้น</Badge>;
      case "CANCELLED": return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">ยกเลิก</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">บุคลากรศูนย์สอบ</h1>
          <p className="text-sm text-muted-foreground">จัดการบุคลากรประจำศูนย์สอบ</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          เพิ่มบุคลากร
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="สถานะ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            {STAFF_STATUSES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={filterPosition} onValueChange={(v) => { setFilterPosition(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="ตำแหน่ง" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกตำแหน่ง</SelectItem>
            {POSITIONS.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      {!isLoading && meta && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">ทั้งหมด</span><span className="text-2xl font-bold">{meta.total}</span></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">ปฏิบัติงาน</span><span className="text-2xl font-bold text-green-600">{activeCount}</span></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">ลางาน</span><span className="text-2xl font-bold text-amber-600">{onLeaveCount}</span></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">ไม่ได้ปฏิบัติงาน</span><span className="text-2xl font-bold text-gray-500">{inactiveCount}</span></div></CardContent></Card>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายชื่อบุคลากร</CardTitle>
          <CardDescription>{meta ? `บุคลากรทั้งหมด ${meta.total} คน` : "กำลังโหลด..."}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">ยังไม่มีบุคลากร</p>
              <p className="text-sm">เพิ่มบุคลากรใหม่โดยคลิกปุ่ม &quot;เพิ่มบุคลากร&quot;</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead>ศูนย์สอบ</TableHead>
                  <TableHead>เบอร์โทร</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>เวรถัดไป</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{s.user.name}</p>
                        <p className="text-xs text-muted-foreground">{s.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getPositionBadge(s.position)}</TableCell>
                    <TableCell className="text-sm">{s.testCenter.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.phone ?? s.user.phone ?? "—"}</TableCell>
                    <TableCell>{getStatusBadge(s.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatNextShift(s.shifts)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleExpand(s.id)} title="กะงาน">
                          {expandedStaffId === s.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(s)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">หน้า {meta.page} จาก {meta.totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>ก่อนหน้า</Button>
                <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>ถัดไป</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shifts Section */}
      {expandedStaffId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  กะงานของ {expandedStaffName}
                </CardTitle>
                <CardDescription>จัดการตารางเวรของบุคลากร</CardDescription>
              </div>
              <Button size="sm" onClick={openCreateShift} className="gap-1.5">
                <Plus className="h-4 w-4" />
                เพิ่มกะงาน
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isShiftsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : shifts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">ยังไม่มีกะงาน</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่</TableHead>
                    <TableHead>เวลาเริ่ม</TableHead>
                    <TableHead>เวลาสิ้นสุด</TableHead>
                    <TableHead>บทบาท</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>หมายเหตุ</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell className="text-sm">
                        {new Date(shift.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell className="text-sm font-mono">{shift.startTime}</TableCell>
                      <TableCell className="text-sm font-mono">{shift.endTime}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{SHIFT_ROLE_LABELS[shift.role] ?? shift.role}</Badge>
                      </TableCell>
                      <TableCell>{getShiftStatusBadge(shift.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {shift.notes || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditShift(shift)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setShiftDeleteTarget(shift)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Shift Create / Edit Dialog */}
      <Dialog open={shiftDialogOpen} onOpenChange={(open) => { if (!open) { setShiftDialogOpen(false); setShiftEditTarget(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{shiftEditTarget ? "แก้ไขกะงาน" : "เพิ่มกะงาน"}</DialogTitle>
            <DialogDescription>
              {shiftEditTarget ? "แก้ไขข้อมูลกะงาน" : `เพิ่มกะงานให้ ${expandedStaffName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>วันที่ <span className="text-destructive">*</span></Label>
              <Input type="date" value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>เวลาเริ่ม <span className="text-destructive">*</span></Label>
                <Input type="time" value={shiftStartTime} onChange={(e) => setShiftStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>เวลาสิ้นสุด <span className="text-destructive">*</span></Label>
                <Input type="time" value={shiftEndTime} onChange={(e) => setShiftEndTime(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>บทบาท <span className="text-destructive">*</span></Label>
                <Select value={shiftRole} onValueChange={setShiftRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SHIFT_ROLES.map((r) => (<SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>สถานะ</Label>
                <Select value={shiftStatus} onValueChange={setShiftStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SHIFT_STATUSES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>หมายเหตุ</Label>
              <Textarea value={shiftNotes} onChange={(e) => setShiftNotes(e.target.value)} rows={2} placeholder="รายละเอียดเพิ่มเติม..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShiftDialogOpen(false); setShiftEditTarget(null); }}>ยกเลิก</Button>
            <Button onClick={handleShiftSubmit} disabled={isShiftSubmitting} className="gap-1.5">
              {isShiftSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {shiftEditTarget ? "บันทึก" : "เพิ่ม"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shift Delete Confirmation */}
      <AlertDialog open={!!shiftDeleteTarget} onOpenChange={(open) => !open && setShiftDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบกะงาน</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบกะงานวันที่ {shiftDeleteTarget ? new Date(shiftDeleteTarget.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : ""} เวลา {shiftDeleteTarget?.startTime} - {shiftDeleteTarget?.endTime} หรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleShiftDelete} disabled={isShiftDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isShiftDeleting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditTarget(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "แก้ไขบุคลากร" : "เพิ่มบุคลากร"}</DialogTitle>
            <DialogDescription>{editTarget ? "แก้ไขข้อมูลบุคลากร" : "เลือกศูนย์สอบและผู้ใช้ที่ต้องการเพิ่ม"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {!editTarget && (
              <>
                <div className="space-y-2">
                  <Label>ศูนย์สอบ <span className="text-destructive">*</span></Label>
                  <Select value={formTestCenterId} onValueChange={setFormTestCenterId}>
                    <SelectTrigger><SelectValue placeholder="เลือกศูนย์สอบ" /></SelectTrigger>
                    <SelectContent>
                      {(testCenters ?? []).map((tc) => (<SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ผู้ใช้ <span className="text-destructive">*</span></Label>
                  <Select value={formUserId} onValueChange={setFormUserId}>
                    <SelectTrigger><SelectValue placeholder="เลือกผู้ใช้" /></SelectTrigger>
                    <SelectContent>
                      {(users ?? []).map((u) => (<SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>ตำแหน่ง <span className="text-destructive">*</span></Label>
                <Select value={formPosition} onValueChange={setFormPosition}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>สถานะ</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAFF_STATUSES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>เบอร์โทร</Label>
              <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="0x-xxx-xxxx" />
            </div>
            <div className="space-y-2">
              <Label>หมายเหตุ</Label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditTarget(null); }}>ยกเลิก</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-1.5">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editTarget ? "บันทึก" : "เพิ่ม"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบบุคลากร</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบ {deleteTarget?.user.name || deleteTarget?.user.email} จาก {deleteTarget?.testCenter.name} หรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
