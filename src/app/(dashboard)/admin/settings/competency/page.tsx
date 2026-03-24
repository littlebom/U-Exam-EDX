"use client";

import { useState } from "react";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  GripVertical,
  BookOpen,
  X,
  ChevronDown,
  ChevronRight,
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────

interface CompetencyArea {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order: number;
}

interface CompetencyFramework {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  areas: CompetencyArea[];
  _count: { exams: number };
  createdAt: string;
}

interface AreaInput {
  name: string;
  description: string;
  icon: string;
  color: string;
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6",
];

// ─── Page ───────────────────────────────────────────────────────────

export default function CompetencySettingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CompetencyFramework | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CompetencyFramework | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAreas, setFormAreas] = useState<AreaInput[]>([
    { name: "", description: "", icon: "", color: PRESET_COLORS[0] },
  ]);

  const queryClient = useQueryClient();

  const { data: frameworks, isLoading } = useQuery<CompetencyFramework[]>({
    queryKey: ["competency-frameworks"],
    queryFn: async () => {
      const res = await fetch("/api/v1/competency-frameworks");
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const openCreate = () => {
    setEditTarget(null);
    setFormName("");
    setFormDesc("");
    setFormAreas([{ name: "", description: "", icon: "", color: PRESET_COLORS[0] }]);
    setDialogOpen(true);
  };

  const openEdit = (fw: CompetencyFramework) => {
    setEditTarget(fw);
    setFormName(fw.name);
    setFormDesc(fw.description ?? "");
    setFormAreas(
      fw.areas.map((a) => ({
        name: a.name,
        description: a.description ?? "",
        icon: a.icon ?? "",
        color: a.color ?? PRESET_COLORS[0],
      }))
    );
    setDialogOpen(true);
  };

  const addArea = () => {
    const colorIdx = formAreas.length % PRESET_COLORS.length;
    setFormAreas([...formAreas, { name: "", description: "", icon: "", color: PRESET_COLORS[colorIdx] }]);
  };

  const removeArea = (idx: number) => {
    if (formAreas.length <= 1) return;
    setFormAreas(formAreas.filter((_, i) => i !== idx));
  };

  const updateArea = (idx: number, field: keyof AreaInput, value: string) => {
    const updated = [...formAreas];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormAreas(updated);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("กรุณาระบุชื่อกรอบสมรรถนะ");
      return;
    }
    const validAreas = formAreas.filter((a) => a.name.trim());
    if (validAreas.length === 0) {
      toast.error("ต้องมีอย่างน้อย 1 ด้าน");
      return;
    }

    setIsSaving(true);
    try {
      const url = editTarget
        ? `/api/v1/competency-frameworks/${editTarget.id}`
        : "/api/v1/competency-frameworks";
      const method = editTarget ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDesc.trim() || undefined,
          areas: validAreas.map((a) => ({
            name: a.name.trim(),
            description: a.description.trim() || undefined,
            icon: a.icon.trim() || undefined,
            color: a.color || undefined,
          })),
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(editTarget ? "แก้ไขสำเร็จ" : "สร้างกรอบสมรรถนะสำเร็จ");
        setDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ["competency-frameworks"] });
      } else {
        toast.error(json.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/v1/competency-frameworks/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("ลบสำเร็จ");
        setDeleteTarget(null);
        queryClient.invalidateQueries({ queryKey: ["competency-frameworks"] });
      } else {
        toast.error(json.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">กรอบสมรรถนะ (Competency Framework)</h1>
          <p className="text-sm text-muted-foreground">
            กำหนดกรอบสมรรถนะสำหรับแต่ละกลุ่มผู้เรียน เช่น GenEd, พยาบาล, IT
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          สร้างกรอบสมรรถนะ
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !frameworks || frameworks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mb-3 opacity-50" />
            <p className="font-medium">ยังไม่มีกรอบสมรรถนะ</p>
            <p className="text-sm mt-1">สร้างกรอบสมรรถนะเพื่อกำหนดด้านทักษะให้แต่ละกลุ่มผู้เรียน</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {frameworks.map((fw) => {
            const isExpanded = expandedId === fw.id;
            return (
              <Card key={fw.id}>
                <CardHeader className="py-4 px-5">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => setExpandedId(isExpanded ? null : fw.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <CardTitle className="text-base">{fw.name}</CardTitle>
                        <CardDescription className="mt-0.5">
                          {fw.areas.length} ด้าน
                          {fw._count.exams > 0 && ` · ใช้ใน ${fw._count.exams} ชุดสอบ`}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!fw.isActive && (
                        <Badge variant="secondary" className="text-xs">ปิดใช้งาน</Badge>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(fw)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(fw)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-0 px-5 pb-4">
                    {fw.description && (
                      <p className="text-sm text-muted-foreground mb-3">{fw.description}</p>
                    )}
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {fw.areas.map((area, i) => (
                        <div
                          key={area.id}
                          className="flex items-center gap-2.5 rounded-lg border p-3"
                        >
                          <div
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: area.color || PRESET_COLORS[i % PRESET_COLORS.length] }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{area.name}</p>
                            {area.description && (
                              <p className="text-xs text-muted-foreground truncate">{area.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "แก้ไขกรอบสมรรถนะ" : "สร้างกรอบสมรรถนะใหม่"}
            </DialogTitle>
            <DialogDescription>
              กำหนดชื่อและด้านสมรรถนะที่ต้องการประเมิน
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label>ชื่อกรอบสมรรถนะ <span className="text-destructive">*</span></Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="เช่น พยาบาลศาสตร์, GenEd ทักษะศตวรรษที่ 21"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>คำอธิบาย</Label>
              <Textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={2}
                placeholder="อ้างอิงจากมาตรฐานใด เช่น สภาการพยาบาล, TPQI"
              />
            </div>

            {/* Areas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>ด้านสมรรถนะ <span className="text-destructive">*</span></Label>
                <Button variant="outline" size="sm" onClick={addArea} className="gap-1 text-xs">
                  <Plus className="h-3 w-3" />
                  เพิ่มด้าน
                </Button>
              </div>

              <div className="space-y-2">
                {formAreas.map((area, idx) => (
                  <div key={idx} className="flex items-start gap-2 rounded-lg border p-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-2.5 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium w-5">
                          {idx + 1}.
                        </span>
                        <Input
                          value={area.name}
                          onChange={(e) => updateArea(idx, "name", e.target.value)}
                          placeholder="ชื่อด้านสมรรถนะ"
                          className="h-8 text-sm"
                        />
                        <input
                          type="color"
                          value={area.color}
                          onChange={(e) => updateArea(idx, "color", e.target.value)}
                          className="h-8 w-8 rounded border cursor-pointer shrink-0"
                        />
                      </div>
                      <Input
                        value={area.description}
                        onChange={(e) => updateArea(idx, "description", e.target.value)}
                        placeholder="คำอธิบาย (ไม่บังคับ)"
                        className="h-7 text-xs"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeArea(idx)}
                      disabled={formAreas.length <= 1}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
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
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบกรอบสมรรถนะ</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบ &quot;{deleteTarget?.name}&quot; หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
