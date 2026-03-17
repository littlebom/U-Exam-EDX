"use client";

import { useState } from "react";
import {
  Plus,
  Projector,
  Snowflake,
  Camera,
  Loader2,
  DoorOpen,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  createRoomAction,
  updateRoomAction,
  deleteRoomAction,
} from "@/actions/test-center.actions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────

interface RoomItem {
  id: string;
  name: string;
  code: string | null;
  floor: number;
  capacity: number;
  status: string;
  hasProjector: boolean;
  hasAC: boolean;
  hasWebcam: boolean;
  description: string | null;
  notes: string | null;
  testCenter: { id: string; name: string };
  building: { id: string; name: string } | null;
}

interface TestCenterOption {
  id: string;
  name: string;
}

interface BuildingOption {
  id: string;
  name: string;
  testCenterId: string;
}

const ROOM_STATUSES = [
  { value: "AVAILABLE", label: "Available" },
  { value: "IN_USE", label: "In Use" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "INACTIVE", label: "Inactive" },
];

// ─── Helpers ────────────────────────────────────────────────────────

function getRoomStatusBadge(status: string) {
  switch (status) {
    case "AVAILABLE":
      return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Available</Badge>;
    case "IN_USE":
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">In Use</Badge>;
    case "MAINTENANCE":
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Maintenance</Badge>;
    case "INACTIVE":
      return <Badge variant="outline">Inactive</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ─── Page ───────────────────────────────────────────────────────────

export default function RoomsPage() {
  const [page, setPage] = useState(1);
  const [filterTestCenterId, setFilterTestCenterId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RoomItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoomItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formTestCenterId, setFormTestCenterId] = useState("");
  const [formBuildingId, setFormBuildingId] = useState("");
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formFloor, setFormFloor] = useState("1");
  const [formCapacity, setFormCapacity] = useState("0");
  const [formStatus, setFormStatus] = useState("AVAILABLE");
  const [formHasProjector, setFormHasProjector] = useState(false);
  const [formHasAC, setFormHasAC] = useState(true);
  const [formHasWebcam, setFormHasWebcam] = useState(false);
  const [formDescription, setFormDescription] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useList<RoomItem>("rooms", "/api/v1/rooms", {
    page,
    perPage: 50,
    ...(filterTestCenterId && { testCenterId: filterTestCenterId }),
  });
  const rooms = data?.data ?? [];
  const meta = data?.meta;

  const { data: testCenters } = useSimpleList<TestCenterOption>("test-centers-list", "/api/v1/test-centers");
  const { data: buildings } = useSimpleList<BuildingOption>("buildings-list", "/api/v1/buildings");

  // Filter buildings by selected test center in form
  const filteredBuildings = (buildings ?? []).filter(
    (b) => b.testCenterId === formTestCenterId
  );

  const resetForm = () => {
    setFormTestCenterId("");
    setFormBuildingId("");
    setFormName("");
    setFormCode("");
    setFormFloor("1");
    setFormCapacity("0");
    setFormStatus("AVAILABLE");
    setFormHasProjector(false);
    setFormHasAC(true);
    setFormHasWebcam(false);
    setFormDescription("");
    setFormNotes("");
  };

  const openCreate = () => {
    resetForm();
    setEditTarget(null);
    setDialogOpen(true);
  };

  const openEdit = (room: RoomItem) => {
    setFormTestCenterId(room.testCenter.id);
    setFormBuildingId(room.building?.id ?? "");
    setFormName(room.name);
    setFormCode(room.code ?? "");
    setFormFloor(String(room.floor));
    setFormCapacity(String(room.capacity));
    setFormStatus(room.status);
    setFormHasProjector(room.hasProjector);
    setFormHasAC(room.hasAC);
    setFormHasWebcam(room.hasWebcam);
    setFormDescription(room.description ?? "");
    setFormNotes(room.notes ?? "");
    setEditTarget(room);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName || (!editTarget && !formTestCenterId)) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็น");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...(editTarget ? {} : { testCenterId: formTestCenterId }),
        buildingId: formBuildingId || undefined,
        name: formName,
        code: formCode || undefined,
        floor: parseInt(formFloor) || 1,
        capacity: parseInt(formCapacity) || 0,
        status: formStatus,
        hasProjector: formHasProjector,
        hasAC: formHasAC,
        hasWebcam: formHasWebcam,
        description: formDescription || undefined,
        notes: formNotes || undefined,
      };

      const result = editTarget
        ? await updateRoomAction(editTarget.id, payload)
        : await createRoomAction(payload);

      if (result.success) {
        toast.success(editTarget ? "แก้ไขห้องสอบสำเร็จ" : "สร้างห้องสอบสำเร็จ");
        setDialogOpen(false);
        resetForm();
        setEditTarget(null);
        queryClient.invalidateQueries({ queryKey: ["rooms"] });
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
      const result = await deleteRoomAction(deleteTarget.id);
      if (result.success) {
        toast.success("ลบห้องสอบสำเร็จ");
        setDeleteTarget(null);
        queryClient.invalidateQueries({ queryKey: ["rooms"] });
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
          <h1 className="text-2xl font-bold tracking-tight">ห้องสอบ</h1>
          <p className="text-sm text-muted-foreground">จัดการห้องสอบทั้งหมดในศูนย์สอบ</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          เพิ่มห้องสอบ
        </Button>
      </div>

      {/* Filter */}
      <div className="max-w-xs">
        <Select value={filterTestCenterId} onValueChange={(v) => { setFilterTestCenterId(v === "ALL" ? "" : v); setPage(1); }}>
          <SelectTrigger>
            <SelectValue placeholder="ศูนย์สอบทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ศูนย์สอบทั้งหมด</SelectItem>
            {(testCenters ?? []).map((tc) => (
              <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการห้องสอบ</CardTitle>
          <CardDescription>
            {isLoading ? "กำลังโหลด..." : `ห้องสอบทั้งหมด ${meta?.total ?? 0} ห้อง`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">เกิดข้อผิดพลาด: {error.message}</div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <DoorOpen className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">ยังไม่มีห้องสอบ</p>
              <p className="text-sm">เพิ่มห้องสอบในศูนย์สอบเพื่อเริ่มต้น</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ห้อง</TableHead>
                  <TableHead>อาคาร</TableHead>
                  <TableHead>ศูนย์สอบ</TableHead>
                  <TableHead className="text-center">ชั้น</TableHead>
                  <TableHead className="text-center">ความจุ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>อุปกรณ์</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {room.building ? room.building.name : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{room.testCenter.name}</TableCell>
                    <TableCell className="text-center">{room.floor}</TableCell>
                    <TableCell className="text-center">{room.capacity}</TableCell>
                    <TableCell>{getRoomStatusBadge(room.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {room.hasProjector && (
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-muted" title="โปรเจกเตอร์">
                            <Projector className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        )}
                        {room.hasAC && (
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-muted" title="เครื่องปรับอากาศ">
                            <Snowflake className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        )}
                        {room.hasWebcam && (
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-muted" title="กล้อง Webcam">
                            <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(room)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(room)}>
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditTarget(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? "แก้ไขห้องสอบ" : "เพิ่มห้องสอบ"}</DialogTitle>
            <DialogDescription>
              {editTarget ? "แก้ไขข้อมูลห้องสอบ" : "กรอกข้อมูลเพื่อสร้างห้องสอบใหม่"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Test Center (only for create) */}
            {!editTarget && (
              <div className="space-y-2">
                <Label>ศูนย์สอบ <span className="text-destructive">*</span></Label>
                <Select value={formTestCenterId} onValueChange={(v) => { setFormTestCenterId(v); setFormBuildingId(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกศูนย์สอบ" />
                  </SelectTrigger>
                  <SelectContent>
                    {(testCenters ?? []).map((tc) => (
                      <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Building */}
            <div className="space-y-2">
              <Label>อาคาร</Label>
              <Select value={formBuildingId} onValueChange={setFormBuildingId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกอาคาร (ถ้ามี)" />
                </SelectTrigger>
                <SelectContent>
                  {filteredBuildings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Name + Code */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>ชื่อห้อง <span className="text-destructive">*</span></Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="เช่น ห้อง A101" />
              </div>
              <div className="space-y-2">
                <Label>รหัส</Label>
                <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="A101" />
              </div>
            </div>

            {/* Floor + Capacity + Status */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>ชั้น</Label>
                <Input type="number" value={formFloor} onChange={(e) => setFormFloor(e.target.value)} min={0} />
              </div>
              <div className="space-y-2">
                <Label>ความจุ (ที่นั่ง)</Label>
                <Input type="number" value={formCapacity} onChange={(e) => setFormCapacity(e.target.value)} min={0} />
              </div>
              <div className="space-y-2">
                <Label>สถานะ</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROOM_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Equipment toggles */}
            <div className="space-y-3">
              <Label>อุปกรณ์ในห้อง</Label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Projector className="h-4 w-4 text-muted-foreground" />
                    โปรเจกเตอร์
                  </div>
                  <Switch checked={formHasProjector} onCheckedChange={setFormHasProjector} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Snowflake className="h-4 w-4 text-muted-foreground" />
                    เครื่องปรับอากาศ
                  </div>
                  <Switch checked={formHasAC} onCheckedChange={setFormHasAC} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    กล้อง Webcam
                  </div>
                  <Switch checked={formHasWebcam} onCheckedChange={setFormHasWebcam} />
                </div>
              </div>
            </div>

            {/* Description + Notes */}
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
              {editTarget ? "บันทึก" : "สร้าง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบห้องสอบ</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบห้อง &quot;{deleteTarget?.name}&quot; จาก {deleteTarget?.testCenter.name} หรือไม่?
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
