"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Shield,
  Mail,
  Phone,
  Building2,
  FileText,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { FaceImageCard } from "@/components/profile/face-image-card";

// ─── Types ───────────────────────────────────────────────────────────

interface PrivacySettings {
  showEmail: boolean;
  showPhone: boolean;
  showResults: boolean;
  showCertificates: boolean;
  showInstitution: boolean;
}

type PrivacyKey = keyof PrivacySettings;

const privacyItems: Array<{
  key: PrivacyKey;
  label: string;
  description: string;
  icon: typeof Mail;
}> = [
  {
    key: "showEmail",
    label: "แสดงอีเมล",
    description: "อนุญาตให้ผู้อื่นเห็นอีเมลของคุณในโปรไฟล์สาธารณะ",
    icon: Mail,
  },
  {
    key: "showPhone",
    label: "แสดงเบอร์โทร",
    description: "อนุญาตให้ผู้อื่นเห็นเบอร์โทรของคุณในโปรไฟล์สาธารณะ",
    icon: Phone,
  },
  {
    key: "showInstitution",
    label: "แสดงสถาบัน",
    description: "อนุญาตให้ผู้อื่นเห็นสถาบัน/องค์กรของคุณ",
    icon: Building2,
  },
  {
    key: "showResults",
    label: "แสดงผลสอบ",
    description: "อนุญาตให้ผู้อื่นเห็นประวัติผลสอบของคุณ",
    icon: FileText,
  },
  {
    key: "showCertificates",
    label: "แสดง Certificate",
    description: "อนุญาตให้ผู้อื่นเห็น Certificate ที่คุณได้รับ",
    icon: Award,
  },
];

// ─── Component ───────────────────────────────────────────────────────

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: privacyData, isLoading } = useQuery<{
    data: PrivacySettings;
  }>({
    queryKey: ["privacy-settings"],
    queryFn: async () => {
      const res = await fetch("/api/v1/profile/privacy");
      if (!res.ok) throw new Error("Failed to fetch privacy settings");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<PrivacySettings>) => {
      const res = await fetch("/api/v1/profile/privacy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || "บันทึกไม่สำเร็จ");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("บันทึกการตั้งค่าแล้ว");
      queryClient.invalidateQueries({ queryKey: ["privacy-settings"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey: ["privacy-settings"] });
    },
  });

  const handleToggle = (key: PrivacyKey, checked: boolean) => {
    // Optimistic update
    queryClient.setQueryData(
      ["privacy-settings"],
      (old: { data: PrivacySettings } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          data: { ...old.data, [key]: checked },
        };
      }
    );
    updateMutation.mutate({ [key]: checked });
  };

  const settings = privacyData?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/profile">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ตั้งค่า</h1>
          <p className="text-sm text-muted-foreground">
            จัดการความเป็นส่วนตัวและการแสดงผลข้อมูล
          </p>
        </div>
      </div>

      {/* Face Image (Identity Verification) */}
      <FaceImageCard />

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">ความเป็นส่วนตัว</CardTitle>
          </div>
          <CardDescription>
            ควบคุมข้อมูลที่แสดงในโปรไฟล์สาธารณะของคุณ
            เปิดโปรไฟล์สาธารณะได้ที่หน้าแก้ไขข้อมูล
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {privacyItems.map((item, index) => (
            <div key={item.key}>
              <div className="flex items-center justify-between rounded-lg px-2 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <Label
                      htmlFor={item.key}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {item.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={item.key}
                  checked={settings?.[item.key] ?? false}
                  onCheckedChange={(checked) =>
                    handleToggle(item.key, checked)
                  }
                  disabled={updateMutation.isPending}
                />
              </div>
              {index < privacyItems.length - 1 && (
                <div className="mx-2 border-b" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
