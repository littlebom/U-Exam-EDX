"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Palette,
  CreditCard,
  Upload,
  Save,
  Loader2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDetail } from "@/hooks/use-api";
import { useAppSession } from "@/hooks/use-session";
import { toast } from "sonner";

interface TenantSettings {
  email?: string;
  phone?: string;
  address?: string;
  primaryColor?: string;
}

interface TenantData {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  settings: TenantSettings | null;
  plan: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { tenant } = useAppSession();
  const tenantId = tenant?.id;

  // Fetch tenant data from DB
  const {
    data: tenantData,
    isLoading,
    error,
  } = useDetail<TenantData>(
    "tenant-settings",
    `/api/v1/tenants/${tenantId}`,
    !!tenantId
  );

  // Form state
  const [orgName, setOrgName] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#741717");
  const [isSaving, setIsSaving] = useState(false);

  // Populate form when data loads
  useEffect(() => {
    if (tenantData) {
      setOrgName(tenantData.name ?? "");
      setOrgEmail(tenantData.settings?.email ?? "");
      setOrgPhone(tenantData.settings?.phone ?? "");
      setOrgAddress(tenantData.settings?.address ?? "");
      setPrimaryColor(tenantData.settings?.primaryColor ?? "#741717");
    }
  }, [tenantData]);

  const handleSave = async () => {
    if (!tenantId) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/v1/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName,
          settings: {
            email: orgEmail || undefined,
            phone: orgPhone || undefined,
            address: orgAddress || undefined,
            primaryColor: primaryColor || undefined,
          },
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        // Handle validation errors
        if (json.error?.details) {
          const messages = json.error.details
            .map((d: { field: string; message: string }) => `${d.field}: ${d.message}`)
            .join("\n");
          toast.error("ข้อมูลไม่ถูกต้อง", { description: messages });
        } else {
          toast.error(json.error?.message ?? "เกิดข้อผิดพลาด");
        }
        return;
      }

      toast.success("บันทึกการตั้งค่าสำเร็จ");
      queryClient.invalidateQueries({ queryKey: ["tenant-settings"] });
    } catch {
      toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSaving(false);
    }
  };

  // Plan display mapping
  const planLabels: Record<string, { label: string; desc: string }> = {
    free: { label: "Free Plan", desc: "สำหรับทดลองใช้งาน" },
    pro: { label: "Pro Plan", desc: "สำหรับองค์กรขนาดกลาง" },
    enterprise: { label: "Enterprise Plan", desc: "สำหรับองค์กรขนาดใหญ่" },
  };

  // Quota data (still mock — billing module not yet implemented)
  const quotaByPlan: Record<string, { users: number; exams: number; storage: number }> = {
    free: { users: 10, exams: 50, storage: 1 },
    pro: { users: 100, exams: 500, storage: 10 },
    enterprise: { users: 1000, exams: 5000, storage: 100 },
  };

  const currentPlan = tenantData?.plan ?? "free";
  const planInfo = planLabels[currentPlan] ?? planLabels.free;
  const quota = quotaByPlan[currentPlan] ?? quotaByPlan.free;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ตั้งค่าองค์กร</h1>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            ไม่สามารถโหลดข้อมูลองค์กรได้: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ตั้งค่าองค์กร</h1>
        <p className="text-sm text-muted-foreground">
          จัดการข้อมูลและการตั้งค่าขององค์กร
        </p>
      </div>

      {/* Organization Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">ข้อมูลองค์กร</CardTitle>
          </div>
          <CardDescription>ข้อมูลพื้นฐานขององค์กร</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">ชื่อองค์กร</Label>
              <Input
                id="org-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="ชื่อองค์กรของคุณ"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-email">อีเมล</Label>
              <Input
                id="org-email"
                type="email"
                value={orgEmail}
                onChange={(e) => setOrgEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-phone">เบอร์โทร</Label>
              <Input
                id="org-phone"
                value={orgPhone}
                onChange={(e) => setOrgPhone(e.target.value)}
                placeholder="02-123-4567"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-address">ที่อยู่</Label>
            <Textarea
              id="org-address"
              value={orgAddress}
              onChange={(e) => setOrgAddress(e.target.value)}
              className="min-h-20"
              placeholder="ที่อยู่องค์กร"
            />
          </div>
        </CardContent>
      </Card>

      {/* Brand Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">แบรนด์</CardTitle>
          </div>
          <CardDescription>
            ปรับแต่ง Logo และสีหลักขององค์กร
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>โลโก้องค์กร</Label>
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30">
                {tenantData?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tenantData.logoUrl}
                    alt="Logo"
                    className="h-full w-full rounded-lg object-contain"
                  />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground/50" />
                )}
              </div>
              <div className="space-y-1">
                <Button variant="outline" size="sm" className="gap-1.5" disabled>
                  <Upload className="h-4 w-4" />
                  อัปโหลด Logo
                </Button>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG สูงสุด 2MB (แนะนำ 256x256px)
                  <br />
                  <span className="text-muted-foreground/60">
                    (รอเปิดใช้ File Upload Module)
                  </span>
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="primary-color">สีหลัก (Primary Color)</Label>
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-lg border"
                style={{ backgroundColor: primaryColor }}
              />
              <Input
                id="primary-color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="max-w-[150px] font-mono"
                placeholder="#741717"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan & Quota */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">แผนการใช้งาน</CardTitle>
          </div>
          <CardDescription>แผนปัจจุบันและโควต้าการใช้งาน</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Plan */}
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{planInfo.label}</span>
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary"
                >
                  ใช้งานอยู่
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {planInfo.desc}
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              อัปเกรด
            </Button>
          </div>

          {/* Quotas (display based on plan, usage still mock) */}
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              * โควต้าตามแผน (ข้อมูลการใช้งานจริงรอเปิดใช้ Billing Module)
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>ผู้ใช้</span>
                <span className="text-muted-foreground">
                  — / {quota.users} คน
                </span>
              </div>
              <Progress value={0} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>ข้อสอบ</span>
                <span className="text-muted-foreground">
                  — / {quota.exams} ชุด
                </span>
              </div>
              <Progress value={0} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Storage</span>
                <span className="text-muted-foreground">
                  — / {quota.storage} GB
                </span>
              </div>
              <Progress value={0} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSaving ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </div>
    </div>
  );
}
