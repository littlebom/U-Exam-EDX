"use client";

import { useState, useEffect, useRef } from "react";
import {
  Building2,
  Palette,
  CreditCard,
  Upload,
  Save,
  Loader2,
  Globe,
  Facebook,
  MessageCircle,
  Clock,
  Map,
  Instagram,
  Youtube,
  Music2,
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

interface BusinessHourEntry {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

const DAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];

const DEFAULT_BUSINESS_HOURS: BusinessHourEntry[] = DAYS.map((day, i) => ({
  day,
  open: "08:30",
  close: "16:30",
  closed: i >= 5, // เสาร์-อาทิตย์ ปิด
}));

interface TenantSettings {
  email?: string;
  phone?: string;
  address?: string;
  facebook?: string;
  line?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  businessHours?: BusinessHourEntry[];
  googleMapUrl?: string;
  primaryColor?: string;
  auditLogRetentionDays?: number;
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
  // orgWebsite removed — ใช้ข้อมูลจาก tenant name/domain แทน
  const [orgFacebook, setOrgFacebook] = useState("");
  const [orgLine, setOrgLine] = useState("");
  const [orgInstagram, setOrgInstagram] = useState("");
  const [orgTwitter, setOrgTwitter] = useState("");
  const [orgYoutube, setOrgYoutube] = useState("");
  const [orgTiktok, setOrgTiktok] = useState("");
  const [businessHours, setBusinessHours] = useState<BusinessHourEntry[]>(DEFAULT_BUSINESS_HOURS);
  const [googleMapUrl, setGoogleMapUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#741717");
  const [auditLogRetentionDays, setAuditLogRetentionDays] = useState(7);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form when data loads
  useEffect(() => {
    if (tenantData) {
      setOrgName(tenantData.name ?? "");
      setOrgEmail(tenantData.settings?.email ?? "");
      setOrgPhone(tenantData.settings?.phone ?? "");
      setOrgAddress(tenantData.settings?.address ?? "");
      setOrgFacebook(tenantData.settings?.facebook ?? "");
      setOrgLine(tenantData.settings?.line ?? "");
      setOrgInstagram(tenantData.settings?.instagram ?? "");
      setOrgTwitter(tenantData.settings?.twitter ?? "");
      setOrgYoutube(tenantData.settings?.youtube ?? "");
      setOrgTiktok(tenantData.settings?.tiktok ?? "");
      setBusinessHours(
        Array.isArray(tenantData.settings?.businessHours)
          ? tenantData.settings.businessHours
          : DEFAULT_BUSINESS_HOURS
      );
      setGoogleMapUrl(tenantData.settings?.googleMapUrl ?? "");
      setPrimaryColor(tenantData.settings?.primaryColor ?? "#741717");
      setAuditLogRetentionDays(tenantData.settings?.auditLogRetentionDays ?? 7);
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
            // website removed
            facebook: orgFacebook || undefined,
            line: orgLine || undefined,
            instagram: orgInstagram || undefined,
            twitter: orgTwitter || undefined,
            youtube: orgYoutube || undefined,
            tiktok: orgTiktok || undefined,
            businessHours: businessHours || undefined,
            googleMapUrl: googleMapUrl || undefined,
            primaryColor: primaryColor || undefined,
            auditLogRetentionDays,
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
      queryClient.invalidateQueries({ queryKey: ["tenant-theme"] });
    } catch {
      toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenantId) return;

    // Client-side validation
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("รองรับเฉพาะไฟล์ PNG, JPG, WEBP เท่านั้น");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("ขนาดไฟล์ต้องไม่เกิน 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch(`/api/v1/tenants/${tenantId}/logo`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(json.error?.message ?? "อัปโหลดล้มเหลว");
        return;
      }

      toast.success("อัปโหลดโลโก้สำเร็จ");
      queryClient.invalidateQueries({ queryKey: ["tenant-settings"] });
    } catch {
      toast.error("ไม่สามารถอัปโหลดได้");
    } finally {
      setIsUploading(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
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

          <Separator />

          {/* Business Hours & Map */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">เวลาทำการและแผนที่</p>
            </div>

            {/* Business Hours — day/time picker */}
            <div className="space-y-2 mb-4">
              <Label>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  เวลาทำการ
                </span>
              </Label>
              <div className="space-y-2 rounded-lg border p-3">
                {businessHours.map((entry, idx) => (
                  <div key={entry.day} className="flex items-center gap-2 text-sm">
                    <span className="w-20 shrink-0 font-medium">{entry.day}</span>
                    <label className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={!entry.closed}
                        onChange={(e) => {
                          const updated = [...businessHours];
                          updated[idx] = { ...entry, closed: !e.target.checked };
                          setBusinessHours(updated);
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className={entry.closed ? "text-muted-foreground" : ""}>
                        {entry.closed ? "ปิด" : "เปิด"}
                      </span>
                    </label>
                    {!entry.closed && (
                      <>
                        <input
                          type="time"
                          value={entry.open}
                          onChange={(e) => {
                            const updated = [...businessHours];
                            updated[idx] = { ...entry, open: e.target.value };
                            setBusinessHours(updated);
                          }}
                          className="rounded border border-input bg-background px-2 py-1 text-sm"
                        />
                        <span className="text-muted-foreground">—</span>
                        <input
                          type="time"
                          value={entry.close}
                          onChange={(e) => {
                            const updated = [...businessHours];
                            updated[idx] = { ...entry, close: e.target.value };
                            setBusinessHours(updated);
                          }}
                          className="rounded border border-input bg-background px-2 py-1 text-sm"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="google-map-url">
                  <span className="flex items-center gap-1.5">
                    <Map className="h-3.5 w-3.5" />
                    Google Map URL
                  </span>
                </Label>
                <Input
                  id="google-map-url"
                  type="url"
                  value={googleMapUrl}
                  onChange={(e) => setGoogleMapUrl(e.target.value)}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                />
                <p className="text-xs text-muted-foreground">
                  ใส่ URL จาก Google Maps &gt; แชร์ &gt; ฝังแผนที่ (Embed)
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Social Media / Additional Contact */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">ช่องทางติดต่อเพิ่มเติม</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org-facebook">
                  <span className="flex items-center gap-1.5">
                    <Facebook className="h-3.5 w-3.5" />
                    Facebook
                  </span>
                </Label>
                <Input
                  id="org-facebook"
                  type="url"
                  value={orgFacebook}
                  onChange={(e) => setOrgFacebook(e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org-line">
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5" />
                    LINE
                  </span>
                </Label>
                <Input
                  id="org-line"
                  value={orgLine}
                  onChange={(e) => setOrgLine(e.target.value)}
                  placeholder="@line-id หรือ https://line.me/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-instagram">
                  <span className="flex items-center gap-1.5">
                    <Instagram className="h-3.5 w-3.5" />
                    Instagram
                  </span>
                </Label>
                <Input
                  id="org-instagram"
                  type="url"
                  value={orgInstagram}
                  onChange={(e) => setOrgInstagram(e.target.value)}
                  placeholder="https://instagram.com/yourpage"
                />
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org-twitter">
                  <span className="flex items-center gap-1.5">
                    X (Twitter)
                  </span>
                </Label>
                <Input
                  id="org-twitter"
                  type="url"
                  value={orgTwitter}
                  onChange={(e) => setOrgTwitter(e.target.value)}
                  placeholder="https://x.com/yourpage"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-youtube">
                  <span className="flex items-center gap-1.5">
                    <Youtube className="h-3.5 w-3.5" />
                    YouTube
                  </span>
                </Label>
                <Input
                  id="org-youtube"
                  type="url"
                  value={orgYoutube}
                  onChange={(e) => setOrgYoutube(e.target.value)}
                  placeholder="https://youtube.com/@yourchannel"
                />
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org-tiktok">
                  <span className="flex items-center gap-1.5">
                    <Music2 className="h-3.5 w-3.5" />
                    TikTok
                  </span>
                </Label>
                <Input
                  id="org-tiktok"
                  type="url"
                  value={orgTiktok}
                  onChange={(e) => setOrgTiktok(e.target.value)}
                  placeholder="https://tiktok.com/@yourpage"
                />
              </div>
            </div>
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
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isUploading ? "กำลังอัปโหลด..." : "อัปโหลด Logo"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WEBP สูงสุด 2MB (แนะนำ 256x256px)
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="primary-color">สีหลัก (Primary Color)</Label>
            <p className="text-xs text-muted-foreground">
              สีนี้จะถูกใช้เป็นสีหลักของ UI ทั้งระบบ (ปุ่ม, ลิงก์, sidebar, ฯลฯ)
            </p>
            <div className="flex items-center gap-3">
              <label
                className="relative h-10 w-10 cursor-pointer rounded-lg border overflow-hidden"
                style={{ backgroundColor: primaryColor }}
              >
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
              <Input
                id="primary-color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="max-w-[150px] font-mono"
                placeholder="#741717"
              />
              {primaryColor !== "#741717" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => setPrimaryColor("#741717")}
                >
                  รีเซ็ตเป็นค่าเริ่มต้น
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Retention */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Audit Logs</CardTitle>
          </div>
          <CardDescription>
            กำหนดระยะเวลาเก็บ Audit Logs ในฐานข้อมูล (ไฟล์ JSONL เก็บถาวร)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>เก็บ Audit Logs ใน DB</Label>
            <select
              value={auditLogRetentionDays}
              onChange={(e) => setAuditLogRetentionDays(Number(e.target.value))}
              className="flex h-9 w-full max-w-[250px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value={7}>7 วัน</option>
              <option value={14}>14 วัน</option>
              <option value={30}>30 วัน</option>
              <option value={60}>60 วัน</option>
              <option value={90}>90 วัน</option>
              <option value={180}>180 วัน</option>
              <option value={365}>365 วัน</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Logs เก่ากว่าที่กำหนดจะถูกลบจากฐานข้อมูลอัตโนมัติ — ไฟล์ JSONL (logs/audit/) เก็บถาวรไม่ถูกลบ
            </p>
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
