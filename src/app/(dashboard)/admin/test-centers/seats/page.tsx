"use client";

import { useState, useMemo } from "react";
import { Loader2, Armchair, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useList } from "@/hooks/use-api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  updateSeatAction,
  bulkUpdateSeatStatusAction,
  deleteSeatAction,
} from "@/actions/seat-equipment.actions";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────

interface RoomOption {
  id: string;
  name: string;
  testCenter: { id: string; name: string };
}

interface SeatItem {
  id: string;
  seatNumber: string;
  row: number;
  column: number;
  status: string;
  type: string;
}

interface SeatsResponse {
  data: SeatItem[];
  room: { id: string; name: string; capacity: number };
  stats: { total: number; available: number; occupied: number; reserved: number; disabled: number };
}

const SEAT_STATUSES = [
  { value: "AVAILABLE", label: "ว่าง" },
  { value: "OCCUPIED", label: "ใช้งาน" },
  { value: "RESERVED", label: "จอง" },
  { value: "DISABLED", label: "ปิดใช้งาน" },
];

const SEAT_TYPES = [
  { value: "REGULAR", label: "ปกติ" },
  { value: "WHEELCHAIR", label: "รถเข็น" },
  { value: "SPECIAL", label: "พิเศษ" },
];

// ─── Helpers ────────────────────────────────────────────────────────

function getSeatClasses(status: string, isSelected: boolean) {
  if (isSelected) return "border-primary bg-primary/10 text-primary ring-2 ring-primary";
  switch (status) {
    case "AVAILABLE": return "border-input bg-background hover:bg-accent hover:text-accent-foreground";
    case "OCCUPIED": return "bg-primary text-primary-foreground";
    case "RESERVED": return "bg-blue-600 text-white";
    case "DISABLED": return "bg-muted text-muted-foreground opacity-50";
    default: return "border-input bg-background";
  }
}

// ─── Page ───────────────────────────────────────────────────────────

export default function SeatsPage() {
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set());
  const [editSeat, setEditSeat] = useState<SeatItem | null>(null);
  const [editStatus, setEditStatus] = useState("AVAILABLE");
  const [editType, setEditType] = useState("REGULAR");
  const [bulkStatus, setBulkStatus] = useState("AVAILABLE");
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data: roomsData, isLoading: roomsLoading } = useList<RoomOption>(
    "rooms-for-seats", "/api/v1/rooms", { perPage: 100 }
  );
  const rooms = roomsData?.data ?? [];

  const { data: seatsResponse, isLoading: seatsLoading } = useQuery<SeatsResponse>({
    queryKey: ["seats", selectedRoomId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/seats?roomId=${selectedRoomId}`);
      if (!res.ok) throw new Error("Failed to fetch seats");
      const json = await res.json();
      return { data: json.data, room: json.room, stats: json.stats };
    },
    enabled: !!selectedRoomId,
  });

  const seats = seatsResponse?.data ?? [];
  const stats = seatsResponse?.stats ?? { total: 0, available: 0, occupied: 0, reserved: 0, disabled: 0 };

  const gridInfo = useMemo(() => {
    if (seats.length === 0) return { rows: 0, cols: 0 };
    return { rows: Math.max(...seats.map((s) => s.row)) + 1, cols: Math.max(...seats.map((s) => s.column)) + 1 };
  }, [seats]);

  const seatMap = useMemo(() => {
    const map = new Map<string, SeatItem>();
    for (const seat of seats) map.set(`${seat.row}-${seat.column}`, seat);
    return map;
  }, [seats]);

  function toggleSeat(seat: SeatItem) {
    setSelectedSeatIds((prev) => {
      const next = new Set(prev);
      if (next.has(seat.id)) next.delete(seat.id);
      else next.add(seat.id);
      return next;
    });
  }

  function handleSeatClick(seat: SeatItem) {
    if (selectedSeatIds.size > 0) {
      // In multi-select mode, toggle
      toggleSeat(seat);
    } else {
      // Single click → open edit dialog
      setEditSeat(seat);
      setEditStatus(seat.status);
      setEditType(seat.type);
    }
  }

  async function handleGenerateSeats() {
    if (!selectedRoomId) return;
    try {
      const res = await fetch("/api/v1/seats/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: selectedRoomId, rows: 6, columns: 8 }),
      });
      if (res.ok) {
        toast.success("สร้างผังที่นั่งสำเร็จ");
        queryClient.invalidateQueries({ queryKey: ["seats", selectedRoomId] });
        setSelectedSeatIds(new Set());
      } else {
        toast.error("เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    }
  }

  // Single seat update
  async function handleEditSave() {
    if (!editSeat) return;
    setIsSubmitting(true);
    try {
      const result = await updateSeatAction(editSeat.id, { status: editStatus, type: editType });
      if (result.success) {
        toast.success("อัปเดตที่นั่งสำเร็จ");
        setEditSeat(null);
        queryClient.invalidateQueries({ queryKey: ["seats", selectedRoomId] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Delete single seat
  async function handleDeleteSeat() {
    if (!editSeat) return;
    setIsSubmitting(true);
    try {
      const result = await deleteSeatAction(editSeat.id);
      if (result.success) {
        toast.success("ลบที่นั่งสำเร็จ");
        setEditSeat(null);
        queryClient.invalidateQueries({ queryKey: ["seats", selectedRoomId] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Bulk status update
  async function handleBulkUpdate() {
    if (selectedSeatIds.size === 0 || !selectedRoomId) return;
    setIsSubmitting(true);
    try {
      const result = await bulkUpdateSeatStatusAction(
        selectedRoomId,
        Array.from(selectedSeatIds),
        bulkStatus
      );
      if (result.success) {
        toast.success(`อัปเดต ${selectedSeatIds.size} ที่นั่งสำเร็จ`);
        setSelectedSeatIds(new Set());
        setShowBulkDialog(false);
        queryClient.invalidateQueries({ queryKey: ["seats", selectedRoomId] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Clear all seats
  async function handleClearAll() {
    if (!selectedRoomId) return;
    setIsSubmitting(true);
    try {
      // Delete all seats one by one (no bulk delete API)
      let success = 0;
      for (const seat of seats) {
        const result = await deleteSeatAction(seat.id);
        if (result.success) success++;
      }
      toast.success(`ลบ ${success} ที่นั่งสำเร็จ`);
      setShowClearDialog(false);
      setSelectedSeatIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["seats", selectedRoomId] });
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ผังที่นั่ง</h1>
          <p className="text-sm text-muted-foreground">จัดการผังที่นั่งสำหรับห้องสอบ</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedRoomId} onValueChange={(v) => { setSelectedRoomId(v); setSelectedSeatIds(new Set()); }}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="เลือกห้องสอบ" />
            </SelectTrigger>
            <SelectContent>
              {roomsLoading ? (
                <SelectItem value="_loading" disabled>กำลังโหลด...</SelectItem>
              ) : rooms.length === 0 ? (
                <SelectItem value="_empty" disabled>ไม่มีห้องสอบ</SelectItem>
              ) : (
                rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>{room.name} — {room.testCenter.name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {selectedRoomId && seats.length === 0 && !seatsLoading && (
            <Button onClick={handleGenerateSeats}>สร้างผัง 6×8</Button>
          )}
        </div>
      </div>

      {!selectedRoomId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Armchair className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">เลือกห้องสอบ</p>
            <p className="text-sm">เลือกห้องสอบจากเมนูด้านบนเพื่อดูผังที่นั่ง</p>
          </CardContent>
        </Card>
      ) : seatsLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">ทั้งหมด</span><span className="text-2xl font-bold">{stats.total}</span></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">ว่าง</span><span className="text-2xl font-bold text-green-600">{stats.available}</span></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">จอง/ใช้งาน</span><span className="text-2xl font-bold text-primary">{stats.occupied + stats.reserved}</span></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">ปิด</span><span className="text-2xl font-bold text-muted-foreground">{stats.disabled}</span></div></CardContent></Card>
          </div>

          {/* Action Bar */}
          {seats.length > 0 && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Select all available seats
                  const available = seats.filter((s) => s.status === "AVAILABLE").map((s) => s.id);
                  setSelectedSeatIds(new Set(available));
                }}
              >
                เลือกทั้งหมดที่ว่าง
              </Button>
              {selectedSeatIds.size > 0 && (
                <>
                  <Button size="sm" onClick={() => setShowBulkDialog(true)}>
                    เปลี่ยนสถานะ ({selectedSeatIds.size})
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSeatIds(new Set())}>
                    ยกเลิกเลือก
                  </Button>
                </>
              )}
              <div className="ml-auto">
                <Button variant="destructive" size="sm" onClick={() => setShowClearDialog(true)} className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" />
                  ลบทั้งหมด
                </Button>
              </div>
            </div>
          )}

          {/* Seat Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">แผนผังที่นั่ง</CardTitle>
              <CardDescription>
                คลิกที่นั่งเพื่อแก้ไข หรือเลือกหลายที่นั่งแล้วเปลี่ยนสถานะพร้อมกัน
                {selectedSeatIds.size > 0 && (
                  <span className="ml-2 font-medium text-primary">(เลือกแล้ว {selectedSeatIds.size} ที่นั่ง)</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {seats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Armchair className="h-10 w-10 mb-3 opacity-50" />
                  <p className="font-medium">ยังไม่มีผังที่นั่ง</p>
                  <p className="text-sm">คลิก &quot;สร้างผัง&quot; เพื่อสร้างที่นั่งอัตโนมัติ</p>
                </div>
              ) : (
                <>
                  <div className="mx-auto mb-8 max-w-md rounded-md bg-muted px-4 py-2 text-center text-sm text-muted-foreground">
                    กระดาน / หน้าห้อง
                  </div>

                  <div className="mx-auto max-w-lg">
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${gridInfo.cols}, minmax(0, 1fr))` }}>
                      {Array.from({ length: gridInfo.rows }, (_, r) =>
                        Array.from({ length: gridInfo.cols }, (_, c) => {
                          const seat = seatMap.get(`${r}-${c}`);
                          if (!seat) return <div key={`${r}-${c}`} />;
                          const isSelected = selectedSeatIds.has(seat.id);
                          return (
                            <Button
                              key={seat.id}
                              variant="outline"
                              size="sm"
                              className={cn("h-10 w-full p-0 text-xs font-medium", getSeatClasses(seat.status, isSelected))}
                              onClick={() => handleSeatClick(seat)}
                              title={`ที่นั่ง ${seat.seatNumber} (${seat.status})`}
                            >
                              {seat.seatNumber}
                            </Button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
                    <div className="flex items-center gap-2"><div className="h-4 w-4 rounded border border-input bg-background" /><span className="text-sm text-muted-foreground">ว่าง</span></div>
                    <div className="flex items-center gap-2"><div className="h-4 w-4 rounded bg-primary" /><span className="text-sm text-muted-foreground">ใช้งาน</span></div>
                    <div className="flex items-center gap-2"><div className="h-4 w-4 rounded bg-blue-600" /><span className="text-sm text-muted-foreground">จอง</span></div>
                    <div className="flex items-center gap-2"><div className="h-4 w-4 rounded border-2 border-primary bg-primary/10" /><span className="text-sm text-muted-foreground">เลือกอยู่</span></div>
                    <div className="flex items-center gap-2"><div className="h-4 w-4 rounded bg-muted opacity-50" /><span className="text-sm text-muted-foreground">ปิดใช้งาน</span></div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Single Seat Edit Dialog */}
      <Dialog open={!!editSeat} onOpenChange={(open) => !open && setEditSeat(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>แก้ไขที่นั่ง {editSeat?.seatNumber}</DialogTitle>
            <DialogDescription>เปลี่ยนสถานะหรือประเภทของที่นั่ง</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>สถานะ</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEAT_STATUSES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ประเภท</Label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEAT_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="destructive" size="sm" onClick={handleDeleteSeat} disabled={isSubmitting} className="gap-1.5 sm:mr-auto">
              <Trash2 className="h-3.5 w-3.5" />
              ลบที่นั่ง
            </Button>
            <Button variant="outline" onClick={() => setEditSeat(null)}>ยกเลิก</Button>
            <Button onClick={handleEditSave} disabled={isSubmitting} className="gap-1.5">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>เปลี่ยนสถานะที่นั่ง</DialogTitle>
            <DialogDescription>เปลี่ยนสถานะ {selectedSeatIds.size} ที่นั่งที่เลือก</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>สถานะใหม่</Label>
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEAT_STATUSES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>ยกเลิก</Button>
            <Button onClick={handleBulkUpdate} disabled={isSubmitting} className="gap-1.5">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              อัปเดต
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Confirmation */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบที่นั่งทั้งหมด</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบที่นั่งทั้งหมด ({seats.length} ที่นั่ง) ในห้องนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} disabled={isSubmitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              ลบทั้งหมด
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
