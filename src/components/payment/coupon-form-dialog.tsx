"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  createCouponAction,
  updateCouponAction,
} from "@/actions/payment.actions";

interface CouponFormData {
  id?: string;
  code: string;
  description: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  maxUses: number;
  minAmount: number;
  maxDiscount: number;
  validFrom: string;
  validTo: string;
  isActive?: boolean;
}

interface CouponFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: CouponFormData | null;
  mode?: "create" | "edit";
}

const defaultFormData: CouponFormData = {
  code: "",
  description: "",
  type: "PERCENTAGE",
  value: 0,
  maxUses: 0,
  minAmount: 0,
  maxDiscount: 0,
  validFrom: "",
  validTo: "",
};

function toDateInputValue(dateStr: string | undefined): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export function CouponFormDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData,
  mode = "create",
}: CouponFormDialogProps) {
  const [form, setForm] = useState<CouponFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = mode === "edit";

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          ...initialData,
          validFrom: toDateInputValue(initialData.validFrom),
          validTo: toDateInputValue(initialData.validTo),
          minAmount: initialData.minAmount || 0,
          maxDiscount: initialData.maxDiscount || 0,
        });
      } else {
        setForm(defaultFormData);
      }
      setErrors({});
    }
  }, [open, initialData]);

  const update = <K extends keyof CouponFormData>(
    key: K,
    value: CouponFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.code || form.code.length < 3) {
      errs.code = "รหัสคูปองต้องมีอย่างน้อย 3 ตัวอักษร";
    } else if (!/^[A-Z0-9_-]+$/.test(form.code)) {
      errs.code = "ต้องเป็นตัวพิมพ์ใหญ่ ตัวเลข - หรือ _ เท่านั้น";
    }

    if (!form.value || form.value <= 0) {
      errs.value = "ค่าส่วนลดต้องมากกว่า 0";
    }
    if (form.type === "PERCENTAGE" && form.value > 100) {
      errs.value = "เปอร์เซ็นต์ส่วนลดต้องไม่เกิน 100%";
    }

    if (!form.validFrom) errs.validFrom = "กรุณาระบุวันเริ่มต้น";
    if (!form.validTo) errs.validTo = "กรุณาระบุวันสิ้นสุด";
    if (form.validFrom && form.validTo && form.validFrom >= form.validTo) {
      errs.validTo = "วันสิ้นสุดต้องมากกว่าวันเริ่มต้น";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        description: form.description || undefined,
        type: form.type,
        value: Number(form.value),
        maxUses: Number(form.maxUses) || 0,
        minAmount: Number(form.minAmount) || undefined,
        maxDiscount: Number(form.maxDiscount) || undefined,
        validFrom: new Date(form.validFrom).toISOString(),
        validTo: new Date(form.validTo).toISOString(),
        ...(isEdit && form.isActive !== undefined
          ? { isActive: form.isActive }
          : {}),
      };

      const result = isEdit
        ? await updateCouponAction(form.id!, payload)
        : await createCouponAction(payload);

      if (result.success) {
        toast.success(
          isEdit ? "อัปเดตคูปองสำเร็จ" : "สร้างคูปองสำเร็จ"
        );
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดที่ไม่คาดคิด");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "แก้ไขคูปอง" : "สร้างคูปองใหม่"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "แก้ไขข้อมูลคูปองส่วนลด"
              : "สร้างคูปองส่วนลดสำหรับค่าสมัครสอบ"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Code */}
          <div className="grid gap-2">
            <Label htmlFor="code">รหัสคูปอง *</Label>
            <Input
              id="code"
              placeholder="เช่น EXAM2026, NEWUSER50"
              value={form.code}
              onChange={(e) =>
                update("code", e.target.value.toUpperCase())
              }
              disabled={isEdit}
              className="font-mono"
            />
            {errors.code && (
              <p className="text-xs text-destructive">{errors.code}</p>
            )}
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">รายละเอียด</Label>
            <Textarea
              id="description"
              placeholder="รายละเอียดคูปอง (ไม่บังคับ)"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={2}
            />
          </div>

          {/* Type + Value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>ประเภทส่วนลด *</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  update("type", v as "PERCENTAGE" | "FIXED")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">เปอร์เซ็นต์ (%)</SelectItem>
                  <SelectItem value="FIXED">จำนวนเงิน (฿)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="value">
                ค่าส่วนลด * {form.type === "PERCENTAGE" ? "(%)" : "(฿)"}
              </Label>
              <Input
                id="value"
                type="number"
                min={0}
                max={form.type === "PERCENTAGE" ? 100 : undefined}
                step={form.type === "PERCENTAGE" ? 1 : 0.01}
                value={form.value || ""}
                onChange={(e) =>
                  update("value", parseFloat(e.target.value) || 0)
                }
              />
              {errors.value && (
                <p className="text-xs text-destructive">{errors.value}</p>
              )}
            </div>
          </div>

          {/* Max Uses + Min Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="maxUses">จำนวนครั้งที่ใช้ได้</Label>
              <Input
                id="maxUses"
                type="number"
                min={0}
                placeholder="0 = ไม่จำกัด"
                value={form.maxUses || ""}
                onChange={(e) =>
                  update("maxUses", parseInt(e.target.value) || 0)
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="minAmount">ยอดขั้นต่ำ (฿)</Label>
              <Input
                id="minAmount"
                type="number"
                min={0}
                placeholder="0 = ไม่มีขั้นต่ำ"
                value={form.minAmount || ""}
                onChange={(e) =>
                  update("minAmount", parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>

          {/* Max Discount (for PERCENTAGE) */}
          {form.type === "PERCENTAGE" && (
            <div className="grid gap-2">
              <Label htmlFor="maxDiscount">ส่วนลดสูงสุด (฿)</Label>
              <Input
                id="maxDiscount"
                type="number"
                min={0}
                placeholder="0 = ไม่จำกัด"
                value={form.maxDiscount || ""}
                onChange={(e) =>
                  update(
                    "maxDiscount",
                    parseFloat(e.target.value) || 0
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                จำกัดจำนวนเงินส่วนลดสูงสุดเมื่อเป็นเปอร์เซ็นต์
              </p>
            </div>
          )}

          {/* Valid From + Valid To */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="validFrom">เริ่มใช้ได้ *</Label>
              <Input
                id="validFrom"
                type="date"
                value={form.validFrom}
                onChange={(e) => update("validFrom", e.target.value)}
              />
              {errors.validFrom && (
                <p className="text-xs text-destructive">
                  {errors.validFrom}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="validTo">สิ้นสุด *</Label>
              <Input
                id="validTo"
                type="date"
                value={form.validTo}
                onChange={(e) => update("validTo", e.target.value)}
              />
              {errors.validTo && (
                <p className="text-xs text-destructive">
                  {errors.validTo}
                </p>
              )}
            </div>
          </div>

          {/* Active toggle (edit only) */}
          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>เปิดใช้งาน</Label>
                <p className="text-xs text-muted-foreground">
                  เปิด/ปิดการใช้งานคูปองนี้
                </p>
              </div>
              <Switch
                checked={form.isActive ?? true}
                onCheckedChange={(v) => update("isActive", v)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEdit ? "บันทึก" : "สร้างคูปอง"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
