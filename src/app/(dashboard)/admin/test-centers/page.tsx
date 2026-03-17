"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  MapPin,
  DoorOpen,
  Users,
  Star,
  Wifi,
  Car,
  Coffee,
  Accessibility,
  Lock,
  Bath,
  Armchair,
  Building2,
  Stethoscope,
  UtensilsCrossed,
  Loader2,
  Search,
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
import { useList, useSimpleList } from "@/hooks/use-api";
import {
  createTestCenterAction,
  updateTestCenterAction,
  deleteTestCenterAction,
} from "@/actions/test-center.actions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────

interface TestCenterItem {
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
  rating: number;
  operatingHours: string | null;
  roomsCount: number;
  totalCapacity: number;
  buildingsCount: number;
  description: string | null;
  managerId: string | null;
  manager: { id: string; name: string; email: string } | null;
}

interface UserOption {
  id: string;
  name: string | null;
  email: string;
}

// ─── Constants ──────────────────────────────────────────────────────

const facilityIcons: Record<string, React.ElementType> = {
  "ที่จอดรถ": Car,
  "Wi-Fi ความเร็วสูง": Wifi,
  "ห้องน้ำ": Bath,
  "จุดพักรอ": Armchair,
  "ตู้ล็อคเกอร์": Lock,
  "ร้านกาแฟ": Coffee,
  "ลิฟท์": Building2,
  "ทางลาดสำหรับผู้พิการ": Accessibility,
  "ร้านอาหาร": UtensilsCrossed,
  "ห้องปฐมพยาบาล": Stethoscope,
};

const FACILITY_OPTIONS = Object.keys(facilityIcons);

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "INACTIVE", label: "Inactive" },
];

// ─── Helper Components ───────────────────────────────────────────────

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        >
          Active
        </Badge>
      );
    case "MAINTENANCE":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
        >
          Maintenance
        </Badge>
      );
    case "INACTIVE":
      return (
        <Badge
          variant="secondary"
          className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
        >
          Inactive
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function renderStars(rating: number) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  const stars = [];

  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(
        <Star
          key={i}
          className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
        />
      );
    } else if (i === full && hasHalf) {
      stars.push(
        <Star
          key={i}
          className="h-3.5 w-3.5 fill-amber-400/50 text-amber-400"
        />
      );
    } else {
      stars.push(
        <Star
          key={i}
          className="h-3.5 w-3.5 text-muted-foreground/30"
        />
      );
    }
  }

  return stars;
}

// ─── Page Component ──────────────────────────────────────────────────

export default function TestCentersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TestCenterItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TestCenterItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formDistrict, setFormDistrict] = useState("");
  const [formProvince, setFormProvince] = useState("");
  const [formPostalCode, setFormPostalCode] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [formOperatingHours, setFormOperatingHours] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formManagerId, setFormManagerId] = useState("");
  const [formFacilities, setFormFacilities] = useState<string[]>([]);

  const queryClient = useQueryClient();

  const { data: centersData, isLoading } = useList<TestCenterItem>(
    "test-centers",
    "/api/v1/test-centers",
    { perPage: 50, search: searchQuery || undefined }
  );

  const centers = centersData?.data ?? [];

  const { data: users } = useSimpleList<UserOption>("users-list", "/api/v1/users");

  // Reset form
  const resetForm = () => {
    setFormName("");
    setFormCode("");
    setFormAddress("");
    setFormDistrict("");
    setFormProvince("");
    setFormPostalCode("");
    setFormPhone("");
    setFormEmail("");
    setFormStatus("ACTIVE");
    setFormOperatingHours("");
    setFormDescription("");
    setFormManagerId("");
    setFormFacilities([]);
  };

  // Open create dialog
  const openCreate = () => {
    resetForm();
    setEditTarget(null);
    setDialogOpen(true);
  };

  // Open edit dialog
  const openEdit = (center: TestCenterItem) => {
    setFormName(center.name);
    setFormCode(center.code ?? "");
    setFormAddress(center.address);
    setFormDistrict(center.district);
    setFormProvince(center.province);
    setFormPostalCode(center.postalCode);
    setFormPhone(center.phone ?? "");
    setFormEmail(center.email ?? "");
    setFormStatus(center.status);
    setFormOperatingHours(center.operatingHours ?? "");
    setFormDescription(center.description ?? "");
    setFormManagerId(center.managerId ?? "");
    setFormFacilities(center.facilities ?? []);
    setEditTarget(center);
    setDialogOpen(true);
  };

  // Handle submit (create or update)
  const handleSubmit = async () => {
    if (!formName || !formAddress || !formDistrict || !formProvince || !formPostalCode) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็น");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formName,
        code: formCode || undefined,
        address: formAddress,
        district: formDistrict,
        province: formProvince,
        postalCode: formPostalCode,
        phone: formPhone || undefined,
        email: formEmail || undefined,
        status: formStatus,
        operatingHours: formOperatingHours || undefined,
        description: formDescription || undefined,
        managerId: formManagerId || undefined,
        facilities: formFacilities.length > 0 ? formFacilities : undefined,
      };

      const result = editTarget
        ? await updateTestCenterAction(editTarget.id, payload)
        : await createTestCenterAction(payload);

      if (result.success) {
        toast.success(editTarget ? "แก้ไขศูนย์สอบสำเร็จ" : "สร้างศูนย์สอบสำเร็จ");
        setDialogOpen(false);
        resetForm();
        setEditTarget(null);
        queryClient.invalidateQueries({ queryKey: ["test-centers"] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deleteTestCenterAction(deleteTarget.id);
      if (result.success) {
        toast.success("ลบศูนย์สอบสำเร็จ");
        setDeleteTarget(null);
        queryClient.invalidateQueries({ queryKey: ["test-centers"] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle facility selection
  const toggleFacility = (facility: string) => {
    setFormFacilities((prev) =>
      prev.includes(facility)
        ? prev.filter((f) => f !== facility)
        : [...prev, facility]
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ศูนย์สอบ</h1>
          <p className="text-sm text-muted-foreground">
            จัดการศูนย์สอบทั้งหมดในระบบ ({centersData?.meta?.total ?? 0} ศูนย์)
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          เพิ่มศูนย์สอบ
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ค้นหาศูนย์สอบ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : centers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Building2 className="h-12 w-12 mb-3" />
          <p className="text-sm font-medium">ยังไม่มีศูนย์สอบ</p>
          <p className="text-xs mt-1">คลิก &quot;เพิ่มศูนย์สอบ&quot; เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {centers.map((center) => {
            const facilities = Array.isArray(center.facilities) ? center.facilities : [];
            return (
              <Card key={center.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">
                      {center.name}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {getStatusBadge(center.status)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(center)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(center)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      {center.address}, {center.district}, {center.province}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <DoorOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{center.roomsCount} ห้องสอบ</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{center.totalCapacity} ที่นั่ง</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {renderStars(center.rating)}
                    </div>
                    <span className="text-sm font-medium">{center.rating}</span>
                  </div>

                  {/* Facilities */}
                  {facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {facilities.slice(0, 6).map((facility) => {
                        const Icon = facilityIcons[facility as string];
                        return Icon ? (
                          <div
                            key={facility}
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-muted"
                            title={facility as string}
                          >
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        ) : null;
                      })}
                      {facilities.length > 6 && (
                        <div className="flex h-7 items-center px-1.5 text-xs text-muted-foreground">
                          +{facilities.length - 6}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action */}
                  <div className="mt-auto pt-2">
                    <Link href={`/test-centers/${center.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        ดูรายละเอียด
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditTarget(null); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? "แก้ไขศูนย์สอบ" : "เพิ่มศูนย์สอบ"}</DialogTitle>
            <DialogDescription>
              {editTarget ? "แก้ไขข้อมูลศูนย์สอบ" : "กรอกข้อมูลเพื่อสร้างศูนย์สอบใหม่"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Row 1: Name + Code */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>ชื่อศูนย์สอบ <span className="text-destructive">*</span></Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="เช่น มหาวิทยาลัย ..." />
              </div>
              <div className="space-y-2">
                <Label>รหัส</Label>
                <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="TC-001" />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label>ที่อยู่ <span className="text-destructive">*</span></Label>
              <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="เลขที่ ถนน ..." />
            </div>

            {/* Row: District + Province + Postal */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>เขต/อำเภอ <span className="text-destructive">*</span></Label>
                <Input value={formDistrict} onChange={(e) => setFormDistrict(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>จังหวัด <span className="text-destructive">*</span></Label>
                <Input value={formProvince} onChange={(e) => setFormProvince(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>รหัสไปรษณีย์ <span className="text-destructive">*</span></Label>
                <Input value={formPostalCode} onChange={(e) => setFormPostalCode(e.target.value)} maxLength={5} />
              </div>
            </div>

            {/* Row: Phone + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>โทรศัพท์</Label>
                <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="0x-xxx-xxxx" />
              </div>
              <div className="space-y-2">
                <Label>อีเมล</Label>
                <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} type="email" placeholder="center@example.com" />
              </div>
            </div>

            {/* Row: Status + Manager + Operating Hours */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>สถานะ</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ผู้จัดการ</Label>
                <Select value={formManagerId} onValueChange={setFormManagerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกผู้จัดการ" />
                  </SelectTrigger>
                  <SelectContent>
                    {(users ?? []).map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>เวลาทำการ</Label>
                <Input value={formOperatingHours} onChange={(e) => setFormOperatingHours(e.target.value)} placeholder="08:00 - 17:00" />
              </div>
            </div>

            {/* Facilities */}
            <div className="space-y-2">
              <Label>สิ่งอำนวยความสะดวก</Label>
              <div className="flex flex-wrap gap-2">
                {FACILITY_OPTIONS.map((facility) => {
                  const Icon = facilityIcons[facility];
                  const selected = formFacilities.includes(facility);
                  return (
                    <button
                      key={facility}
                      type="button"
                      onClick={() => toggleFacility(facility)}
                      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      {facility}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>คำอธิบาย</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} placeholder="รายละเอียดเพิ่มเติม..." />
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
            <AlertDialogTitle>ลบศูนย์สอบ</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบศูนย์สอบ &quot;{deleteTarget?.name}&quot; หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
