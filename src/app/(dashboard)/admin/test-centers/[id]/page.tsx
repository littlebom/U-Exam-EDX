"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  DoorOpen,
  Armchair,
  Monitor,
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Shield,
  X,
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBuildingAction,
  updateBuildingAction,
  deleteBuildingAction,
} from "@/actions/test-center.actions";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────

interface BuildingItem {
  id: string;
  name: string;
  code: string | null;
  floors: number;
  status: string;
  description: string | null;
  _count?: { rooms: number };
}

interface RoomSummary {
  id: string;
  name: string;
  code: string | null;
  floor: number;
  capacity: number;
  status: string;
  building: { id: string; name: string } | null;
}

interface TestCenterDetail {
  id: string;
  name: string;
  code: string | null;
  address: string;
  district: string;
  province: string;
  postalCode: string;
  phone: string | null;
  email: string | null;
  status: string;
  facilities: string[] | null;
  operatingHours: string | null;
  description: string | null;
  rating: number;
  allowedIps: string[] | null;
  manager: { id: string; name: string; email: string } | null;
  buildings: BuildingItem[];
  rooms: RoomSummary[];
  _count?: { rooms: number; equipment: number; centerStaff: number };
}

const BUILDING_STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "INACTIVE", label: "Inactive" },
];

// ─── Helpers ────────────────────────────────────────────────────────

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE": case "AVAILABLE":
      return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{status === "AVAILABLE" ? "Available" : "Active"}</Badge>;
    case "MAINTENANCE": case "IN_USE":
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">{status === "IN_USE" ? "In Use" : "Maintenance"}</Badge>;
    case "INACTIVE":
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">Inactive</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ─── Page ───────────────────────────────────────────────────────────

export default function TestCenterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const centerId = params.id as string;
  const queryClient = useQueryClient();

  // Building form state
  const [buildingDialogOpen, setBuildingDialogOpen] = useState(false);
  const [editBuilding, setEditBuilding] = useState<BuildingItem | null>(null);
  const [deleteBuilding, setDeleteBuilding] = useState<BuildingItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formBuildingName, setFormBuildingName] = useState("");
  const [formBuildingCode, setFormBuildingCode] = useState("");
  const [formBuildingFloors, setFormBuildingFloors] = useState("1");
  const [formBuildingStatus, setFormBuildingStatus] = useState("ACTIVE");
  const [formBuildingDescription, setFormBuildingDescription] = useState("");

  // IP management state
  const [newIp, setNewIp] = useState("");
  const [isSavingIps, setIsSavingIps] = useState(false);

  // Fetch test center detail
  const { data: centerData, isLoading } = useQuery<{ data: TestCenterDetail }>({
    queryKey: ["test-center-detail", centerId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/test-centers/${centerId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!centerId,
  });

  const center = centerData?.data;
  const buildings = center?.buildings ?? [];
  const rooms = center?.rooms ?? [];
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);

  const resetBuildingForm = () => {
    setFormBuildingName("");
    setFormBuildingCode("");
    setFormBuildingFloors("1");
    setFormBuildingStatus("ACTIVE");
    setFormBuildingDescription("");
  };

  const openCreateBuilding = () => {
    resetBuildingForm();
    setEditBuilding(null);
    setBuildingDialogOpen(true);
  };

  const openEditBuilding = (b: BuildingItem) => {
    setFormBuildingName(b.name);
    setFormBuildingCode(b.code ?? "");
    setFormBuildingFloors(String(b.floors));
    setFormBuildingStatus(b.status);
    setFormBuildingDescription(b.description ?? "");
    setEditBuilding(b);
    setBuildingDialogOpen(true);
  };

  const handleBuildingSubmit = async () => {
    if (!formBuildingName) { toast.error("กรุณากรอกชื่ออาคาร"); return; }
    setIsSubmitting(true);
    try {
      const payload = {
        ...(editBuilding ? {} : { testCenterId: centerId }),
        name: formBuildingName,
        code: formBuildingCode || undefined,
        floors: parseInt(formBuildingFloors) || 1,
        status: formBuildingStatus,
        description: formBuildingDescription || undefined,
      };

      const result = editBuilding
        ? await updateBuildingAction(editBuilding.id, payload)
        : await createBuildingAction(payload);

      if (result.success) {
        toast.success(editBuilding ? "แก้ไขอาคารสำเร็จ" : "สร้างอาคารสำเร็จ");
        setBuildingDialogOpen(false);
        resetBuildingForm();
        setEditBuilding(null);
        queryClient.invalidateQueries({ queryKey: ["test-center-detail", centerId] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuildingDelete = async () => {
    if (!deleteBuilding) return;
    setIsDeleting(true);
    try {
      const result = await deleteBuildingAction(deleteBuilding.id);
      if (result.success) {
        toast.success("ลบอาคารสำเร็จ");
        setDeleteBuilding(null);
        queryClient.invalidateQueries({ queryKey: ["test-center-detail", centerId] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!center) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Building2 className="h-12 w-12 mb-3 opacity-50" />
        <p className="font-medium">ไม่พบศูนย์สอบ</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/test-centers")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          กลับ
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/test-centers")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{center.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(center.status)}
              {center.code && <span className="text-sm text-muted-foreground">({center.code})</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ข้อมูลทั่วไป</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>{center.address}, {center.district}, {center.province} {center.postalCode}</span>
            </div>
            {center.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{center.phone}</span>
              </div>
            )}
            {center.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{center.email}</span>
              </div>
            )}
            {center.operatingHours && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                เวลาทำการ: {center.operatingHours}
              </div>
            )}
            {center.manager && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                ผู้จัดการ: {center.manager.name} ({center.manager.email})
              </div>
            )}
          </div>
          {center.description && (
            <p className="mt-3 text-sm text-muted-foreground">{center.description}</p>
          )}
          {center.facilities && center.facilities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {center.facilities.map((f) => (
                <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* IP Restriction */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">จำกัด IP Address</CardTitle>
          </div>
          <CardDescription>
            กำหนด IP หรือ CIDR ที่อนุญาตให้เข้าสอบจากศูนย์สอบนี้ (เปิดใช้งานในแต่ละรอบสอบ)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current IPs */}
          {(center.allowedIps && center.allowedIps.length > 0) ? (
            <div className="flex flex-wrap gap-2">
              {center.allowedIps.map((ip) => (
                <Badge
                  key={ip}
                  variant="secondary"
                  className="gap-1.5 pl-2.5 pr-1.5 py-1 font-mono text-xs"
                >
                  {ip}
                  <button
                    type="button"
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                    onClick={async () => {
                      const updated = center.allowedIps!.filter((i) => i !== ip);
                      setIsSavingIps(true);
                      try {
                        const res = await fetch(`/api/v1/test-centers/${centerId}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ allowedIps: updated }),
                        });
                        const json = await res.json();
                        if (json.success) {
                          toast.success("ลบ IP สำเร็จ");
                          queryClient.invalidateQueries({ queryKey: ["test-center-detail", centerId] });
                        } else {
                          toast.error(json.error || "เกิดข้อผิดพลาด");
                        }
                      } catch { toast.error("เกิดข้อผิดพลาด"); }
                      finally { setIsSavingIps(false); }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              ยังไม่มี IP ที่กำหนด — อนุญาตทุก IP (เมื่อไม่ได้เปิด IP check ในรอบสอบ)
            </p>
          )}

          {/* Add new IP */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="เช่น 192.168.1.0/24 หรือ 10.0.0.5"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              className="max-w-xs font-mono text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  document.getElementById("btn-add-ip")?.click();
                }
              }}
            />
            <Button
              id="btn-add-ip"
              size="sm"
              variant="outline"
              disabled={isSavingIps || !newIp.trim()}
              onClick={async () => {
                const ip = newIp.trim();
                // Basic validation
                const ipv4Regex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d{1,2})?$/;
                if (!ipv4Regex.test(ip)) {
                  toast.error("รูปแบบ IP ไม่ถูกต้อง (เช่น 192.168.1.0/24)");
                  return;
                }
                const currentIps = center.allowedIps ?? [];
                if (currentIps.includes(ip)) {
                  toast.error("IP นี้มีอยู่แล้ว");
                  return;
                }
                setIsSavingIps(true);
                try {
                  const res = await fetch(`/api/v1/test-centers/${centerId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ allowedIps: [...currentIps, ip] }),
                  });
                  const json = await res.json();
                  if (json.success) {
                    toast.success("เพิ่ม IP สำเร็จ");
                    setNewIp("");
                    queryClient.invalidateQueries({ queryKey: ["test-center-detail", centerId] });
                  } else {
                    toast.error(json.error || "เกิดข้อผิดพลาด");
                  }
                } catch { toast.error("เกิดข้อผิดพลาด"); }
                finally { setIsSavingIps(false); }
              }}
              className="gap-1.5"
            >
              {isSavingIps ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              เพิ่ม
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            💡 รองรับ IPv4 เดี่ยว (เช่น 10.0.0.5) หรือ CIDR (เช่น 192.168.1.0/24)
            — เปิดใช้งานโดยเลือก &quot;จำกัด IP ศูนย์สอบ&quot; ในตั้งค่ารอบสอบ
          </p>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">อาคาร</span></div><span className="text-2xl font-bold">{buildings.length}</span></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><DoorOpen className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">ห้องสอบ</span></div><span className="text-2xl font-bold">{rooms.length}</span></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><Armchair className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">ที่นั่งรวม</span></div><span className="text-2xl font-bold">{totalCapacity}</span></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">บุคลากร</span></div><span className="text-2xl font-bold">{center._count?.centerStaff ?? 0}</span></CardContent></Card>
      </div>

      {/* Buildings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">อาคาร ({buildings.length})</CardTitle>
            <CardDescription>อาคารภายในศูนย์สอบ</CardDescription>
          </div>
          <Button size="sm" onClick={openCreateBuilding} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            เพิ่มอาคาร
          </Button>
        </CardHeader>
        <CardContent>
          {buildings.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <Building2 className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">ยังไม่มีอาคาร</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่ออาคาร</TableHead>
                  <TableHead>รหัส</TableHead>
                  <TableHead className="text-center">จำนวนชั้น</TableHead>
                  <TableHead className="text-center">ห้อง</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buildings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{b.code ?? "—"}</TableCell>
                    <TableCell className="text-center">{b.floors}</TableCell>
                    <TableCell className="text-center">{b._count?.rooms ?? 0}</TableCell>
                    <TableCell>{getStatusBadge(b.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditBuilding(b)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteBuilding(b)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Rooms Summary */}
      {rooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ห้องสอบ ({rooms.length})</CardTitle>
            <CardDescription>ห้องสอบทั้งหมดในศูนย์สอบ</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ห้อง</TableHead>
                  <TableHead>อาคาร</TableHead>
                  <TableHead className="text-center">ชั้น</TableHead>
                  <TableHead className="text-center">ความจุ</TableHead>
                  <TableHead>สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.building?.name ?? "—"}</TableCell>
                    <TableCell className="text-center">{r.floor}</TableCell>
                    <TableCell className="text-center">{r.capacity}</TableCell>
                    <TableCell>{getStatusBadge(r.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Building Create/Edit Dialog */}
      <Dialog open={buildingDialogOpen} onOpenChange={(open) => { if (!open) { setBuildingDialogOpen(false); setEditBuilding(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editBuilding ? "แก้ไขอาคาร" : "เพิ่มอาคาร"}</DialogTitle>
            <DialogDescription>{editBuilding ? "แก้ไขข้อมูลอาคาร" : "เพิ่มอาคารใหม่ในศูนย์สอบ"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>ชื่ออาคาร <span className="text-destructive">*</span></Label>
                <Input value={formBuildingName} onChange={(e) => setFormBuildingName(e.target.value)} placeholder="เช่น อาคาร A" />
              </div>
              <div className="space-y-2">
                <Label>รหัส</Label>
                <Input value={formBuildingCode} onChange={(e) => setFormBuildingCode(e.target.value)} placeholder="A" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>จำนวนชั้น</Label>
                <Input type="number" value={formBuildingFloors} onChange={(e) => setFormBuildingFloors(e.target.value)} min={1} />
              </div>
              <div className="space-y-2">
                <Label>สถานะ</Label>
                <Select value={formBuildingStatus} onValueChange={setFormBuildingStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUILDING_STATUSES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>คำอธิบาย</Label>
              <Textarea value={formBuildingDescription} onChange={(e) => setFormBuildingDescription(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBuildingDialogOpen(false); setEditBuilding(null); }}>ยกเลิก</Button>
            <Button onClick={handleBuildingSubmit} disabled={isSubmitting} className="gap-1.5">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editBuilding ? "บันทึก" : "เพิ่ม"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Building Delete Confirmation */}
      <AlertDialog open={!!deleteBuilding} onOpenChange={(open) => !open && setDeleteBuilding(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบอาคาร</AlertDialogTitle>
            <AlertDialogDescription>ต้องการลบอาคาร &quot;{deleteBuilding?.name}&quot; หรือไม่?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleBuildingDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
