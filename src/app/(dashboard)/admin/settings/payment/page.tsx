"use client";

import { useState } from "react";
import {
  CreditCard,
  QrCode,
  Copy,
  Check,
  Loader2,
  Shield,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface PaymentSettings {
  isConfigured: boolean;
  mode: "test" | "live" | "not_configured";
  maskedSecretKey: string;
  maskedPublishableKey: string;
  webhookUrl: string;
  stripeEnabled: boolean;
  paymentMethods: string[];
}

export default function PaymentSettingsPage() {
  const queryClient = useQueryClient();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading } = useQuery<{ success: boolean; data: PaymentSettings }>({
    queryKey: ["payment-settings"],
    queryFn: async () => {
      const res = await fetch("/api/v1/settings/payment");
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json();
    },
  });

  const settings = data?.data;

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("คัดลอกแล้ว");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleToggleStripe = async (enabled: boolean) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/settings/payment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeEnabled: enabled }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["payment-settings"] });
        toast.success(enabled ? "เปิดใช้งาน Stripe แล้ว" : "ปิดการใช้งาน Stripe แล้ว");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleMethod = async (method: string, checked: boolean) => {
    if (!settings) return;
    const newMethods = checked
      ? [...settings.paymentMethods, method]
      : settings.paymentMethods.filter((m) => m !== method);

    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/settings/payment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethods: newMethods }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["payment-settings"] });
        toast.success("บันทึกแล้ว");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ตั้งค่าช่องทางชำระเงิน</h1>
        <p className="text-sm text-muted-foreground">
          จัดการการเชื่อมต่อ Stripe Payment Gateway
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#635BFF]/10">
                <Zap className="h-5 w-5 text-[#635BFF]" />
              </div>
              <div>
                <CardTitle className="text-base">Stripe</CardTitle>
                <CardDescription>Payment Gateway</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {settings.isConfigured ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  เชื่อมต่อแล้ว
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  ยังไม่ได้ตั้งค่า
                </Badge>
              )}
              {settings.mode === "test" && (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  Test Mode
                </Badge>
              )}
              {settings.mode === "live" && (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                  Live Mode
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label className="text-sm font-medium">เปิดใช้งาน Stripe</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                เปิดหรือปิดการชำระเงินผ่าน Stripe สำหรับองค์กรของคุณ
              </p>
            </div>
            <Switch
              checked={!!settings.stripeEnabled}
              onCheckedChange={handleToggleStripe}
              disabled={isSaving || !settings.isConfigured}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            การตั้งค่า API Keys
          </CardTitle>
          <CardDescription>
            Keys ถูกกำหนดใน Environment Variables (แก้ไขใน .env)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Secret Key */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Secret Key</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md border bg-muted/50 px-3 py-2 font-mono text-sm">
                {settings.maskedSecretKey || "ยังไม่ได้ตั้งค่า"}
              </code>
            </div>
          </div>

          {/* Publishable Key */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Publishable Key</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md border bg-muted/50 px-3 py-2 font-mono text-sm">
                {settings.maskedPublishableKey || "ยังไม่ได้ตั้งค่า"}
              </code>
            </div>
          </div>

          {/* Webhook URL */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Webhook URL</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md border bg-muted/50 px-3 py-2 font-mono text-sm truncate">
                {settings.webhookUrl}
              </code>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => handleCopy(settings.webhookUrl, "webhook")}
              >
                {copiedField === "webhook" ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              คัดลอก URL นี้ไปตั้งค่าใน Stripe Dashboard → Developers → Webhooks
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">วิธีชำระเงินที่เปิดใช้งาน</CardTitle>
          <CardDescription>
            เลือกวิธีชำระเงินที่ต้องการให้ผู้สมัครสอบเลือกได้
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Credit / Debit Card</p>
                <p className="text-xs text-muted-foreground">Visa, Mastercard, JCB</p>
              </div>
            </div>
            <Checkbox
              checked={settings.paymentMethods.includes("CREDIT_CARD")}
              onCheckedChange={(checked) =>
                handleToggleMethod("CREDIT_CARD", !!checked)
              }
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <QrCode className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">PromptPay</p>
                <p className="text-xs text-muted-foreground">
                  สแกน QR Code ชำระผ่าน Mobile Banking
                </p>
              </div>
            </div>
            <Checkbox
              checked={settings.paymentMethods.includes("PROMPTPAY")}
              onCheckedChange={(checked) =>
                handleToggleMethod("PROMPTPAY", !!checked)
              }
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Help */}
      {!settings.isConfigured && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-amber-900 dark:text-amber-400">
              วิธีตั้งค่า Stripe
            </h3>
            <ol className="mt-2 list-decimal list-inside space-y-1 text-sm text-amber-800 dark:text-amber-300">
              <li>สร้างบัญชี Stripe ที่ stripe.com</li>
              <li>
                คัดลอก Secret Key และ Publishable Key จาก Stripe Dashboard → API
                Keys
              </li>
              <li>ตั้งค่าใน .env ของระบบ</li>
              <li>
                เพิ่ม Webhook URL ใน Stripe Dashboard → Developers → Webhooks
              </li>
              <li>คัดลอก Webhook Secret มาตั้งค่าใน .env</li>
              <li>Restart server</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
