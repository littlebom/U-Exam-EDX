"use client";

import { useState, useEffect } from "react";
import { Mail, Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
  hasPassword: boolean;
}

export default function EmailSettingsPage() {
  const [config, setConfig] = useState<SmtpConfig>({
    host: "",
    port: 587,
    user: "",
    password: "",
    from: "",
    hasPassword: false,
  });
  const [testEmail, setTestEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Load config
  useEffect(() => {
    fetch("/api/v1/settings/email")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setConfig(json.data);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    if (!config.host || !config.user || !config.from) {
      toast.error("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/settings/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("บันทึกการตั้งค่า SMTP สำเร็จ");
      } else {
        toast.error(json.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) {
      toast.error("กรุณาระบุอีเมลทดสอบ");
      return;
    }
    setIsTesting(true);
    try {
      const res = await fetch("/api/v1/settings/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.data?.message || "ส่งอีเมลทดสอบสำเร็จ");
      } else {
        toast.error(json.error?.message || "ส่งไม่สำเร็จ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isConfigured = !!(config.host && config.user && config.hasPassword);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ตั้งค่าอีเมล (SMTP)</h1>
          <p className="text-sm text-muted-foreground">
            ตั้งค่าเซิร์ฟเวอร์ SMTP สำหรับส่งอีเมลแจ้งเตือน
          </p>
        </div>
      </div>

      {/* Status */}
      <div
        className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
          isConfigured
            ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-400"
            : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400"
        }`}
      >
        {isConfigured ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            SMTP ตั้งค่าแล้ว — พร้อมส่งอีเมล
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4" />
            ยังไม่ได้ตั้งค่า SMTP — ระบบจะไม่ส่งอีเมลแจ้งเตือน
          </>
        )}
      </div>

      {/* SMTP Config Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SMTP Server</CardTitle>
          <CardDescription>
            กรอกข้อมูลเซิร์ฟเวอร์ SMTP สำหรับส่งอีเมล (เช่น Gmail, SendGrid, AWS SES)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>SMTP Host <span className="text-destructive">*</span></Label>
              <Input
                value={config.host}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, host: e.target.value }))
                }
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Port</Label>
              <Input
                type="number"
                value={config.port}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, port: parseInt(e.target.value) || 587 }))
                }
                placeholder="587"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Username / Email <span className="text-destructive">*</span></Label>
              <Input
                value={config.user}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, user: e.target.value }))
                }
                placeholder="noreply@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Password / App Password <span className="text-destructive">*</span></Label>
              <Input
                type="password"
                value={config.password}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, password: e.target.value }))
                }
                placeholder={config.hasPassword ? "••••••••" : "กรอก App Password"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>From Address <span className="text-destructive">*</span></Label>
            <Input
              value={config.from}
              onChange={(e) =>
                setConfig((c) => ({ ...c, from: e.target.value }))
              }
              placeholder="U-Exam <noreply@example.com>"
            />
            <p className="text-xs text-muted-foreground">
              ชื่อและอีเมลที่แสดงเป็นผู้ส่ง เช่น U-Exam &lt;noreply@example.com&gt;
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-1.5"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            บันทึก
          </Button>
        </CardContent>
      </Card>

      {/* Test Email */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ทดสอบส่งอีเมล</CardTitle>
          <CardDescription>
            ส่งอีเมลทดสอบเพื่อตรวจสอบว่าการตั้งค่าถูกต้อง
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="max-w-sm"
            />
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={isTesting || !isConfigured}
              className="gap-1.5"
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              ส่งทดสอบ
            </Button>
          </div>
          {!isConfigured && (
            <p className="mt-2 text-xs text-muted-foreground">
              กรุณาบันทึกการตั้งค่า SMTP ก่อนทดสอบ
            </p>
          )}
        </CardContent>
      </Card>

      {/* Gmail Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">วิธีตั้งค่า Gmail SMTP</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. เปิด 2-Step Verification ใน Google Account</p>
          <p>2. สร้าง App Password: Google Account → Security → App passwords</p>
          <p>3. ใช้ค่า:</p>
          <div className="rounded-md bg-muted p-3 font-mono text-xs space-y-1">
            <p>Host: <strong>smtp.gmail.com</strong></p>
            <p>Port: <strong>587</strong></p>
            <p>Username: <strong>your-email@gmail.com</strong></p>
            <p>Password: <strong>(App Password 16 ตัว)</strong></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
