"use client";

import { useState } from "react";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Trophy,
  Star,
  Medal,
  Award,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────

interface TemplateItem {
  id: string;
  name: string;
  description: string | null;
  minScore: number;
  maxScore: number;
  badgeColor: string;
  badgeIcon: string;
  badgeLabel: string;
  examId: string | null;
  priority: number;
  isActive: boolean;
  exam: { id: string; title: string } | null;
  _count: { badges: number };
}

const ICON_OPTIONS = [
  { value: "trophy", label: "🏆 Trophy", icon: Trophy },
  { value: "star", label: "⭐ Star", icon: Star },
  { value: "medal", label: "🥇 Medal", icon: Medal },
  { value: "award", label: "🎖️ Award", icon: Award },
  { value: "shield", label: "🛡️ Shield", icon: ShieldCheck },
];

const COLOR_PRESETS = [
  { value: "#FFD700", label: "🥇 ทอง (Gold)" },
  { value: "#C0C0C0", label: "🥈 เงิน (Silver)" },
  { value: "#CD7F32", label: "🥉 ทองแดง (Bronze)" },
  { value: "#741717", label: "🎓 แดงเข้ม (Primary)" },
  { value: "#2563EB", label: "💙 น้ำเงิน (Blue)" },
  { value: "#059669", label: "💚 เขียว (Green)" },
  { value: "#7C3AED", label: "💜 ม่วง (Purple)" },
];

// ─── Component ──────────────────────────────────────────────────────

export function BadgeTemplateManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TemplateItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [minScore, setMinScore] = useState(80);
  const [maxScore, setMaxScore] = useState(100);
  const [badgeColor, setBadgeColor] = useState("#FFD700");
  const [badgeIcon, setBadgeIcon] = useState("trophy");
  const [badgeLabel, setBadgeLabel] = useState("CERTIFIED");
  const [priority, setPriority] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["badge-templates"],
    queryFn: async () => {
      const res = await fetch("/api/v1/badge-templates");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const templates: TemplateItem[] = data?.data ?? [];

  function openCreate() {
    setEditTarget(null);
    setName("");
    setDescription("");
    setMinScore(80);
    setMaxScore(100);
    setBadgeColor("#FFD700");
    setBadgeIcon("trophy");
    setBadgeLabel("CERTIFIED");
    setPriority(0);
    setIsActive(true);
    setDialogOpen(true);
  }

  function openEdit(t: TemplateItem) {
    setEditTarget(t);
    setName(t.name);
    setDescription(t.description ?? "");
    setMinScore(t.minScore);
    setMaxScore(t.maxScore);
    setBadgeColor(t.badgeColor);
    setBadgeIcon(t.badgeIcon);
    setBadgeLabel(t.badgeLabel);
    setPriority(t.priority);
    setIsActive(t.isActive);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("กรุณาระบุชื่อ Badge Template");
      return;
    }
    setIsSaving(true);
    try {
      const body = {
        name,
        description: description || null,
        minScore,
        maxScore,
        badgeColor,
        badgeIcon,
        badgeLabel,
        priority,
        isActive,
      };

      const url = editTarget
        ? `/api/v1/badge-templates/${editTarget.id}`
        : "/api/v1/badge-templates";
      const method = editTarget ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.success) {
        toast.success(
          editTarget ? "แก้ไข Badge Template สำเร็จ" : "สร้าง Badge Template สำเร็จ"
        );
        setDialogOpen(false);
        qc.invalidateQueries({ queryKey: ["badge-templates"] });
      } else {
        toast.error(json.error?.message ?? "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/v1/badge-templates/${deleteTarget}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("ลบ Badge Template สำเร็จ");
        qc.invalidateQueries({ queryKey: ["badge-templates"] });
      } else {
        toast.error(json.error?.message ?? "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setDeleteTarget(null);
    }
  }

  function getIconComponent(iconName: string) {
    const found = ICON_OPTIONS.find((i) => i.value === iconName);
    const Icon = found?.icon ?? Trophy;
    return <Icon className="h-5 w-5" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Badge Templates</h3>
          <p className="text-sm text-muted-foreground">
            กำหนดเกณฑ์การให้ Badge อัตโนมัติตามคะแนน
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> สร้าง Template
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Trophy className="h-10 w-10 mb-3 opacity-50" />
            <p className="font-medium">ยังไม่มี Badge Template</p>
            <p className="text-sm">สร้าง Template เพื่อให้ระบบออก Badge อัตโนมัติ</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id} className={!t.isActive ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: t.badgeColor }}
                    >
                      {getIconComponent(t.badgeIcon)}
                    </div>
                    <div>
                      <CardTitle className="text-sm">{t.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {t.badgeLabel}
                      </CardDescription>
                    </div>
                  </div>
                  {!t.isActive && (
                    <Badge variant="secondary" className="text-xs">
                      ปิดใช้งาน
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">เกณฑ์คะแนน</span>
                    <span className="font-medium">
                      {t.minScore}% — {t.maxScore}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ใช้กับวิชา</span>
                    <span className="font-medium truncate max-w-[150px]">
                      {t.exam?.title ?? "ทุกวิชา"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ลำดับความสำคัญ</span>
                    <span className="font-medium">{t.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Badge ที่ออกแล้ว</span>
                    <span className="font-medium">{t._count.badges}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => openEdit(t)}
                  >
                    <Pencil className="h-3 w-3" /> แก้ไข
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteTarget(t.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "แก้ไข Badge Template" : "สร้าง Badge Template"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>ชื่อ Badge <span className="text-destructive">*</span></Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น ดีเยี่ยม, ดี, ผ่าน"
              />
            </div>
            <div className="space-y-2">
              <Label>คำอธิบาย</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="รายละเอียด badge..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>คะแนนขั้นต่ำ (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>คะแนนสูงสุด (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>สี Badge</Label>
                <Select value={badgeColor} onValueChange={setBadgeColor}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: badgeColor }}
                      />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_PRESETS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ไอคอน</Label>
                <Select value={badgeIcon} onValueChange={setBadgeIcon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((i) => (
                      <SelectItem key={i.value} value={i.value}>
                        {i.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ข้อความบน Badge</Label>
                <Input
                  value={badgeLabel}
                  onChange={(e) => setBadgeLabel(e.target.value)}
                  placeholder="CERTIFIED, EXCELLENT"
                />
              </div>
              <div className="space-y-2">
                <Label>ลำดับความสำคัญ</Label>
                <Input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>เปิดใช้งาน</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            {/* Preview */}
            <div className="flex justify-center pt-2">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: badgeColor }}
              >
                {getIconPreview(badgeIcon)}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-1.5">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editTarget ? "บันทึก" : "สร้าง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบ Badge Template</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบ Badge Template นี้หรือไม่? Badge ที่ออกไปแล้วจะไม่ถูกลบ
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function getIconPreview(iconName: string) {
  const found = ICON_OPTIONS.find((i) => i.value === iconName);
  const Icon = found?.icon ?? Trophy;
  return <Icon className="h-7 w-7" />;
}
