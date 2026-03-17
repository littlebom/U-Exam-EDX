"use client";

import { useState } from "react";
import {
  Plus,
  Loader2,
  Monitor,
  Wrench,
  AlertTriangle,
  Pencil,
  Trash2,
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
  createEquipmentAction,
  updateEquipmentAction,
  deleteEquipmentAction,
} from "@/actions/seat-equipment.actions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────

interface EquipmentItem {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  status: string;
  lastChecked: string | null;
  description: string | null;
  notes: string | null;
  roomId: string | null;
  testCenterId: string;
  testCenter: { id: string; name: string };
}

interface TestCenterOption { id: string; name: string; }
interface RoomOption { id: string; name: string; testCenterId: string; }

const EQUIPMENT_TYPES = [
  { value: "COMPUTER", label: "คอมพิวเตอร์" },
  { value: "PROJECTOR", label: "โปรเจกเตอร์" },
  { value: "WEBCAM", label: "กล้องเว็บแคม" },
  { value: "PRINTER", label: "เครื่องพิมพ์" },
  { value: "NETWORK", label: "อุปกรณ์เครือข่าย" },
  { value: "UPS", label: "เครื่องสำรองไฟ" },
  { value: "MONITOR", label: "จอภาพ" },
  { value: "OTHER", label: "อื่นๆ" },
];

const EQUIPMENT_STATUSES = [
  { value: "WORKING", label: "ใช้งานได้" },
  { value: "MAINTENANCE", label: "ซ่อมบำรุง" },
  { value: "BROKEN", label: "ชำรุด" },
];

// ─── Helpers ────────────────────────────────────────────────────────

function getEquipmentStatusBadge(status: string) {
  switch (status) {
    case "WORKING":
      return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">ใช้งานได้</Badge>;
    case "MAINTENANCE":
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">ซ่อมบำรุง</Badge>;
    case "BROKEN":
      return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">ชำรุด</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getTypeBadge(type: string) {
  const found = EQUIPMENT_TYPES.find((t) => t.value === type);
  return <Badge variant="outline">{found?.label ?? type}</Badge>;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Page ───────────────────────────────────────────────────────────

export default function EquipmentPage() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EquipmentItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EquipmentItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formTestCenterId, setFormTestCenterId] = useState("");
  const [formRoomId, setFormRoomId] = useState("");
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("COMPUTER");
  const [formSerialNumber, setFormSerialNumber] = useState("");
  const [formStatus, setFormStatus] = useState("WORKING");
  const [formDescription, setFormDescription] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const queryClient = useQueryClient();

  const params: Record<string, string | number> = { page, perPage: 50 };
  if (filterStatus !== "all") params.status = filterStatus;
  if (filterType !== "all") params.type = filterType;

  const { data: result, isLoading } = useList<EquipmentItem>("equipment", "/api/v1/equipment", params);
  const equipment = result?.data ?? [];
  const meta = result?.meta;

  const { data: testCenters } = useSimpleList<TestCenterOption>("test-centers-list", "/api/v1/test-centers");
  const { data: rooms } = useSimpleList<RoomOption>("rooms-list", "/api/v1/rooms");

  const filteredRooms = (rooms ?? []).filter((r) => r.testCenterId === formTestCenterId);

  const workingCount = equipment.filter((e) => e.status === "WORKING").length;
  const maintenanceCount = equipment.filter((e) => e.status === "MAINTENANCE").length;
  const brokenCount = equipment.filter((e) => e.status === "BROKEN").length;

  const resetForm = () => {
    setFormTestCenterId("");
    setFormRoomId("");
    setFormName("");
    setFormType("COMPUTER");
    setFormSerialNumber("");
    setFormStatus("WORKING");
    setFormDescription("");
    setFormNotes("");
  };

  const openCreate = () => { resetForm(); setEditTarget(null); setDialogOpen(true); };

  const openEdit = (item: EquipmentItem) => {
    setFormTestCenterId(item.testCenterId);
    setFormRoomId(item.roomId ?? "");
    setFormName(item.name);
    setFormType(item.type);
    setFormSerialNumber(item.serialNumber);
    setFormStatus(item.status);
    setFormDescription(item.description ?? "");
    setFormNotes(item.notes ?? "");
    setEditTarget(item);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName || !formSerialNumber || (!editTarget && !formTestCenterId)) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็น");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...(editTarget ? {} : { testCenterId: formTestCenterId }),
        roomId: formRoomId || undefined,
        name: formName,
        type: formType,
        serialNumber: formSerialNumber,
        status: formStatus,
        description: formDescription || undefined,
        notes: formNotes || undefined,
      };

      const result = editTarget
        ? await updateEquipmentAction(editTarget.id, payload)
        : await createEquipmentAction(payload);

      if (result.success) {
        toast.success(editTarget ? "แก้ไขอุปกรณ์สำเร็จ" : "เพิ่มอุปกรณ์สำเร็จ");
        setDialogOpen(false);
        resetForm();
        setEditTarget(null);
        queryClient.invalidateQueries({ queryKey: ["equipment"] });
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
      const result = await deleteEquipmentAction(deleteTarget.id);
      if (result.success) {
        toast.success("ลบอุปกรณ์สำเร็จ");
        setDeleteTarget(null);
        queryClient.invalidateQueries({ queryKey: ["equipment"] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">อุปกรณ์</h1>
          <p className="text-sm text-muted-foreground">จัดการอุปกรณ์ในศูนย์สอบ</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          เพิ่มอุปกรณ์
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="สถานะ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            {EQUIPMENT_STATUSES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="ประเภท" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกประเภท</SelectItem>
            {EQUIPMENT_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      {!isLoading && meta && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">ทั้งหมด</span><span className="text-2xl font-bold">{meta.total}</span></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><Monitor className="h-4 w-4 text-green-600" /><span className="text-sm text-muted-foreground">ใช้งานได้</span></div><span className="text-2xl font-bold text-green-600">{workingCount}</span></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-amber-600" /><span className="text-sm text-muted-foreground">ซ่อมบำรุง</span></div><span className="text-2xl font-bold text-amber-600">{maintenanceCount}</span></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-600" /><span className="text-sm text-muted-foreground">ชำรุด</span></div><span className="text-2xl font-bold text-red-600">{brokenCount}</span></CardContent></Card>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการอุปกรณ์</CardTitle>
          <CardDescription>{meta ? `อุปกรณ์ทั้งหมด ${meta.total} รายการ` : "กำลังโหลด..."}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : equipment.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Monitor className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">ยังไม่มีอุปกรณ์</p>
              <p className="text-sm">เพิ่มอุปกรณ์ใหม่โดยคลิกปุ่ม &quot;เพิ่มอุปกรณ์&quot;</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัส</TableHead>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>ศูนย์สอบ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันตรวจล่าสุด</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((equip) => (
                  <TableRow key={equip.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{equip.serialNumber}</TableCell>
                    <TableCell className="font-medium">{equip.name}</TableCell>
                    <TableCell>{getTypeBadge(equip.type)}</TableCell>
                    <TableCell className="text-sm">{equip.testCenter.name}</TableCell>
                    <TableCell>{getEquipmentStatusBadge(equip.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(equip.lastChecked)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(equip)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(equip)}><Trash2 className="h-4 w-4" /></Button>
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditTarget(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? "แก้ไขอุปกรณ์" : "เพิ่มอุปกรณ์"}</DialogTitle>
            <DialogDescription>{editTarget ? "แก้ไขข้อมูลอุปกรณ์" : "กรอกข้อมูลเพื่อเพิ่มอุปกรณ์ใหม่"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {!editTarget && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>ศูนย์สอบ <span className="text-destructive">*</span></Label>
                  <Select value={formTestCenterId} onValueChange={(v) => { setFormTestCenterId(v); setFormRoomId(""); }}>
                    <SelectTrigger><SelectValue placeholder="เลือกศูนย์สอบ" /></SelectTrigger>
                    <SelectContent>
                      {(testCenters ?? []).map((tc) => (<SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ห้อง</Label>
                  <Select value={formRoomId} onValueChange={setFormRoomId}>
                    <SelectTrigger><SelectValue placeholder="เลือกห้อง (ถ้ามี)" /></SelectTrigger>
                    <SelectContent>
                      {filteredRooms.map((r) => (<SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>ชื่ออุปกรณ์ <span className="text-destructive">*</span></Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="เช่น คอมพิวเตอร์ #1" />
              </div>
              <div className="space-y-2">
                <Label>หมายเลขซีเรียล <span className="text-destructive">*</span></Label>
                <Input value={formSerialNumber} onChange={(e) => setFormSerialNumber(e.target.value)} placeholder="SN-XXXXX" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>ประเภท <span className="text-destructive">*</span></Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>สถานะ</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_STATUSES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>คำอธิบาย</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} />
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
            <AlertDialogTitle>ลบอุปกรณ์</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบอุปกรณ์ &quot;{deleteTarget?.name}&quot; (S/N: {deleteTarget?.serialNumber}) หรือไม่?
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
