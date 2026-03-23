"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Eye, Upload, Plus, Trash2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { toast } from "sonner";

interface Signatory {
  name: string;
  title: string;
  signatureUrl?: string | null;
}

interface DesignData {
  layout: string;
  primaryColor: string;
  font: string;
  borderStyle: string;
  logoUrl: string | null;
  background: string;
  backgroundUrl: string | null;
  signatories: Signatory[];
}

interface TemplateFormData {
  id?: string;
  name: string;
  design: DesignData;
  isDefault: boolean;
  isActive: boolean;
}

const DEFAULT_FORM: TemplateFormData = {
  name: "",
  design: {
    layout: "landscape",
    primaryColor: "#741717",
    font: "NotoSansThai",
    borderStyle: "double",
    logoUrl: null,
    background: "white",
    backgroundUrl: null,
    signatories: [],
  },
  isDefault: false,
  isActive: true,
};

const COLOR_PRESETS = [
  { value: "#741717", label: "Red Wine" },
  { value: "#1e3a5f", label: "Navy Blue" },
  { value: "#1a472a", label: "Forest Green" },
  { value: "#4a1942", label: "Royal Purple" },
  { value: "#333333", label: "Classic Black" },
  { value: "#8b6914", label: "Gold" },
];

const BORDER_STYLES = [
  { value: "double", label: "Double Line" },
  { value: "single", label: "Single Line" },
  { value: "ornate", label: "Ornate" },
  { value: "minimal", label: "Minimal" },
];

const BACKGROUND_PRESETS = [
  { value: "white", label: "ขาว (Classic)" },
  { value: "cream", label: "ครีม (Formal)" },
  { value: "light-blue", label: "ฟ้าอ่อน" },
  { value: "light-gold", label: "ทองอ่อน" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId?: string | null;
  onSaved: () => void;
}

export function TemplateFormDialog({ open, onOpenChange, editId, onSaved }: Props) {
  const [form, setForm] = useState<TemplateFormData>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!editId;

  // Load existing template for edit
  useEffect(() => {
    if (!open) {
      setForm(DEFAULT_FORM);
      return;
    }
    if (!editId) return;

    setIsLoading(true);
    fetch(`/api/v1/certificates/templates/${editId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          const t = json.data;
          const design = (t.design as Record<string, unknown>) ?? {};
          setForm({
            id: t.id,
            name: t.name ?? "",
            design: {
              layout: (design.layout as string) ?? "landscape",
              primaryColor: (design.primaryColor as string) ?? "#741717",
              font: (design.font as string) ?? "NotoSansThai",
              borderStyle: (design.borderStyle as string) ?? "double",
              logoUrl: (design.logoUrl as string) ?? null,
              background: (design.background as string) ?? "white",
              backgroundUrl: (design.backgroundUrl as string) ?? null,
              signatories: (design.signatories as Signatory[]) ?? [],
            },
            isDefault: t.isDefault ?? false,
            isActive: t.isActive ?? true,
          });
        }
      })
      .finally(() => setIsLoading(false));
  }, [open, editId]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("รองรับเฉพาะ PNG, JPG, WEBP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("ขนาดไฟล์ต้องไม่เกิน 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/certificates/templates/logo", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setForm((f) => ({
          ...f,
          design: { ...f.design, logoUrl: json.data.logoUrl },
        }));
        toast.success("อัปโหลด Logo สำเร็จ");
      } else {
        toast.error(json.error?.message || "อัปโหลดไม่สำเร็จ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addSignatory = () => {
    if (form.design.signatories.length >= 2) {
      toast.error("เพิ่มได้สูงสุด 2 คน");
      return;
    }
    setForm((f) => ({
      ...f,
      design: {
        ...f.design,
        signatories: [...f.design.signatories, { name: "", title: "", signatureUrl: null }],
      },
    }));
  };

  const updateSignatory = (index: number, field: keyof Signatory, value: string) => {
    setForm((f) => {
      const sigs = [...f.design.signatories];
      sigs[index] = { ...sigs[index], [field]: value };
      return { ...f, design: { ...f.design, signatories: sigs } };
    });
  };

  const removeSignatory = (index: number) => {
    setForm((f) => ({
      ...f,
      design: {
        ...f.design,
        signatories: f.design.signatories.filter((_, i) => i !== index),
      },
    }));
  };

  const handleSignatureUpload = async (index: number, file: File) => {
    if (!["image/png", "image/webp"].includes(file.type)) {
      toast.error("รองรับเฉพาะ PNG หรือ WEBP (พื้นหลังโปร่งใส)");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      toast.error("ขนาดไฟล์ต้องไม่เกิน 1MB");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/v1/certificates/templates/logo", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (json.success) {
        updateSignatory(index, "signatureUrl", json.data.logoUrl);
        toast.success("อัปโหลดลายเซ็นสำเร็จ");
      } else {
        toast.error(json.error?.message || "อัปโหลดไม่สำเร็จ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("กรุณาระบุชื่อเทมเพลต");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEdit
        ? `/api/v1/certificates/templates/${editId}`
        : "/api/v1/certificates/templates";
      const method = isEdit ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        name: form.name.trim(),
        design: form.design,
        isDefault: form.isDefault,
      };
      if (isEdit) body.isActive = form.isActive;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.success) {
        toast.success(isEdit ? "แก้ไขเทมเพลตสำเร็จ" : "สร้างเทมเพลตสำเร็จ");
        onOpenChange(false);
        onSaved();
      } else {
        toast.error(json.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewUrl = (() => {
    const params = new URLSearchParams({
      name: form.name || "Preview",
      logoUrl: form.design.logoUrl || "",
      background: form.design.background,
      backgroundUrl: form.design.backgroundUrl || "",
      primaryColor: form.design.primaryColor,
      borderStyle: form.design.borderStyle,
      signatories: JSON.stringify(form.design.signatories),
    });
    return `/api/v1/certificates/templates/preview?${params}`;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "แก้ไขเทมเพลต" : "สร้างเทมเพลตใหม่"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "แก้ไขการตั้งค่าเทมเพลตใบรับรอง"
              : "ตั้งค่าเทมเพลตสำหรับออกใบรับรอง"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label>
                ชื่อเทมเพลต <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="เช่น Standard Certificate, Gold Certificate"
              />
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo องค์กร</Label>
              <div className="flex items-center gap-3">
                {form.design.logoUrl ? (
                  <div className="relative h-16 w-16 rounded-md border overflow-hidden bg-white">
                    <img
                      src={form.design.logoUrl}
                      alt="Logo"
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed bg-muted/50">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Upload className="h-3 w-3" />
                    )}
                    {form.design.logoUrl ? "เปลี่ยน" : "อัปโหลด"}
                  </Button>
                  {form.design.logoUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs text-muted-foreground"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          design: { ...f.design, logoUrl: null },
                        }))
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                      ลบ
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground ml-auto">
                  PNG, JPG, WEBP
                  <br />
                  ไม่เกิน 2MB
                </p>
              </div>
            </div>

            {/* Layout + Background row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>รูปแบบหน้ากระดาษ</Label>
                <Select
                  value={form.design.layout}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, design: { ...f.design, layout: v } }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landscape">แนวนอน</SelectItem>
                    <SelectItem value="portrait">แนวตั้ง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>พื้นหลัง (สี)</Label>
                <Select
                  value={form.design.background}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      design: { ...f.design, background: v },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BACKGROUND_PRESETS.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Background Image Upload */}
            <div className="space-y-2">
              <Label>พื้นหลัง (รูปภาพ)</Label>
              <div className="flex items-center gap-3">
                {form.design.backgroundUrl ? (
                  <div className="relative h-16 w-28 rounded-md border overflow-hidden bg-white">
                    <img
                      src={form.design.backgroundUrl}
                      alt="Background"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-28 items-center justify-center rounded-md border border-dashed bg-muted/50">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
                          toast.error("รองรับเฉพาะ PNG, JPG, WEBP");
                          return;
                        }
                        if (file.size > 3 * 1024 * 1024) {
                          toast.error("ขนาดไฟล์ต้องไม่เกิน 3MB");
                          return;
                        }
                        try {
                          const fd = new FormData();
                          fd.append("file", file);
                          const res = await fetch("/api/v1/certificates/templates/logo", {
                            method: "POST",
                            body: fd,
                          });
                          const json = await res.json();
                          if (json.success) {
                            setForm((f) => ({
                              ...f,
                              design: { ...f.design, backgroundUrl: json.data.logoUrl },
                            }));
                            toast.success("อัปโหลด Background สำเร็จ");
                          } else {
                            toast.error(json.error?.message || "อัปโหลดไม่สำเร็จ");
                          }
                        } catch {
                          toast.error("เกิดข้อผิดพลาด");
                        }
                        e.target.value = "";
                      }}
                    />
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs hover:bg-accent">
                      <Upload className="h-3 w-3" />
                      {form.design.backgroundUrl ? "เปลี่ยน" : "อัปโหลด"}
                    </span>
                  </label>
                  {form.design.backgroundUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs text-muted-foreground"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          design: { ...f.design, backgroundUrl: null },
                        }))
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                      ลบ
                    </Button>
                  )}
                </div>
                <p className="ml-auto text-[10px] text-muted-foreground text-right">
                  PNG, JPG, WEBP
                  <br />
                  ไม่เกิน 3MB
                  <br />
                  แนะนำ A4 แนวนอน
                </p>
              </div>
              {form.design.backgroundUrl && (
                <p className="text-xs text-muted-foreground">
                  รูปภาพจะแสดงเต็มหน้า แทนที่สีพื้นหลัง
                </p>
              )}
            </div>

            {/* Primary Color + Border Style row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>สีหลัก</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={form.design.primaryColor}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        design: { ...f.design, primaryColor: v },
                      }))
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_PRESETS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full border"
                              style={{ backgroundColor: c.value }}
                            />
                            {c.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div
                    className="h-9 w-9 shrink-0 rounded-md border"
                    style={{ backgroundColor: form.design.primaryColor }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>รูปแบบกรอบ</Label>
                <Select
                  value={form.design.borderStyle}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      design: { ...f.design, borderStyle: v },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BORDER_STYLES.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Signatories */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>ผู้ลงนาม</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={addSignatory}
                  disabled={form.design.signatories.length >= 2}
                >
                  <Plus className="h-3 w-3" />
                  เพิ่ม ({form.design.signatories.length}/2)
                </Button>
              </div>
              {form.design.signatories.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  ยังไม่มีผู้ลงนาม — กดเพิ่มเพื่อแสดงผู้มีอำนาจลงนามในใบรับรอง
                </p>
              )}
              {form.design.signatories.map((sig, idx) => (
                <div key={idx} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      ผู้ลงนาม {idx + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                      onClick={() => removeSignatory(idx)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    value={sig.name}
                    onChange={(e) => updateSignatory(idx, "name", e.target.value)}
                    placeholder="ชื่อ-นามสกุล"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={sig.title}
                    onChange={(e) => updateSignatory(idx, "title", e.target.value)}
                    placeholder="ตำแหน่ง เช่น คณบดีคณะวิศวกรรมศาสตร์"
                    className="h-8 text-sm"
                  />
                  {/* Signature Image */}
                  <div className="flex items-center gap-2 pt-1">
                    {sig.signatureUrl ? (
                      <div className="h-10 w-24 rounded border bg-white p-1">
                        <img
                          src={sig.signatureUrl}
                          alt="ลายเซ็น"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex h-10 w-24 items-center justify-center rounded border border-dashed bg-muted/30">
                        <span className="text-[10px] text-muted-foreground">ลายเซ็น</span>
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleSignatureUpload(idx, f);
                          e.target.value = "";
                        }}
                      />
                      <span className="inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs hover:bg-accent">
                        <Upload className="h-3 w-3" />
                        {sig.signatureUrl ? "เปลี่ยน" : "อัปโหลด"}
                      </span>
                    </label>
                    {sig.signatureUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                        onClick={() => updateSignatory(idx, "signatureUrl", "")}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                    <span className="ml-auto text-[10px] text-muted-foreground">PNG (พื้นโปร่งใส)</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Toggles */}
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">ตั้งเป็น Default</Label>
                  <p className="text-xs text-muted-foreground">
                    ใช้เทมเพลตนี้เป็นค่าเริ่มต้นเมื่อออกใบรับรอง
                  </p>
                </div>
                <Switch
                  checked={form.isDefault}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, isDefault: v }))
                  }
                />
              </div>
              {isEdit && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">เปิดใช้งาน</Label>
                    <p className="text-xs text-muted-foreground">
                      ปิดเพื่อไม่ให้เลือกเทมเพลตนี้เมื่อออกใบรับรอง
                    </p>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, isActive: v }))
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            className="mr-auto gap-1.5"
            onClick={() => window.open(previewUrl, "_blank")}
          >
            <Eye className="h-4 w-4" />
            ดูตัวอย่าง
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
            className="gap-1.5"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "บันทึก" : "สร้างเทมเพลต"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
