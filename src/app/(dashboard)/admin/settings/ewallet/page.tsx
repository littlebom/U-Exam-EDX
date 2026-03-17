"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wallet,
  Save,
  TestTube,
  Plug,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EwalletSettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["ewallet-connection"],
    queryFn: async () => {
      const res = await fetch("/api/v1/ewallet");
      const json = await res.json();
      return json.data;
    },
  });

  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);

  // Populate form when data loads
  useEffect(() => {
    if (data) {
      setApiUrl(data.apiUrl ?? "");
      setApiKey(data.apiKey ?? "");
      setApiSecret(""); // Never pre-fill secrets
      setWebhookSecret("");
      setIsEnabled(data.isActive ?? true);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/ewallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiUrl,
          apiKey,
          apiSecret,
          webhookSecret,
          isActive: isEnabled,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "เกิดข้อผิดพลาด");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("บันทึกการตั้งค่าสำเร็จ");
      queryClient.invalidateQueries({ queryKey: ["ewallet-connection"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (active: boolean) => {
      const res = await fetch("/api/v1/ewallet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: active }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "เกิดข้อผิดพลาด");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ewallet-connection"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const isConnected = !!data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          e-Wallet Integration
        </h1>
        <p className="text-sm text-muted-foreground">
          ตั้งค่าการเชื่อมต่อกับระบบ e-Wallet ภายนอก
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">สถานะการเชื่อมต่อ</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  isConnected && data?.isActive
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-gray-100 dark:bg-gray-900/30"
                )}
              >
                <Wallet
                  className={cn(
                    "h-5 w-5",
                    isConnected && data?.isActive
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-500 dark:text-gray-400"
                  )}
                />
              </div>
              <div>
                <p className="font-medium">e-Wallet Service</p>
                <p className="text-sm text-muted-foreground">
                  {data?.apiUrl ?? "ยังไม่ได้ตั้งค่า"}
                </p>
              </div>
            </div>
            {isConnected && data?.isActive ? (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                เชื่อมต่อแล้ว
              </Badge>
            ) : isConnected ? (
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
              >
                <XCircle className="mr-1 h-3 w-3" />
                ปิดใช้งาน
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
              >
                ยังไม่เชื่อมต่อ
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ตั้งค่าการเชื่อมต่อ</CardTitle>
          <CardDescription>
            กรอกข้อมูลสำหรับเชื่อมต่อกับ e-Wallet API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-url">API URL</Label>
            <Input
              id="api-url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://ewallet.example.com/api"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="ew_key_xxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-secret">API Secret</Label>
              <Input
                id="api-secret"
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder={isConnected ? "เว้นว่างเพื่อใช้ค่าเดิม" : "ew_secret_xxxxx"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook-secret">Webhook Secret</Label>
            <Input
              id="webhook-secret"
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder={isConnected ? "เว้นว่างเพื่อใช้ค่าเดิม" : "ew_webhook_xxxxx"}
            />
          </div>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center gap-2 rounded-lg border p-4">
            <Checkbox
              id="ewallet-enabled"
              checked={isEnabled}
              onCheckedChange={(checked) => {
                const active = checked === true;
                setIsEnabled(active);
                if (isConnected) {
                  toggleMutation.mutate(active);
                }
              }}
            />
            <Label htmlFor="ewallet-enabled" className="cursor-pointer">
              เปิด/ปิด การเชื่อมต่อ e-Wallet
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="gap-1.5">
              <TestTube className="h-4 w-4" />
              ทดสอบการเชื่อมต่อ
            </Button>
            <Button
              className="gap-1.5"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !apiUrl || !apiKey}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              บันทึก
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
