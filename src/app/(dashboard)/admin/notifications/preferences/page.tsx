"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Mail,
  Smartphone,
  Loader2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Preference {
  type: string;
  label: string;
  description: string;
  inApp: boolean;
  email: boolean;
}

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingType, setSavingType] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/notifications/preferences")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setPreferences(json.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleToggle = async (
    type: string,
    channel: "inApp" | "email",
    value: boolean
  ) => {
    // Optimistic update
    setPreferences((prev) =>
      prev.map((p) => (p.type === type ? { ...p, [channel]: value } : p))
    );
    setSavingType(type);

    try {
      const res = await fetch("/api/v1/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, [channel]: value }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error("บันทึกไม่สำเร็จ");
        // Revert
        setPreferences((prev) =>
          prev.map((p) => (p.type === type ? { ...p, [channel]: !value } : p))
        );
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
      setPreferences((prev) =>
        prev.map((p) => (p.type === type ? { ...p, [channel]: !value } : p))
      );
    } finally {
      setSavingType(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ตั้งค่าการแจ้งเตือน</h1>
        <p className="text-sm text-muted-foreground">
          เลือกช่องทางการรับแจ้งเตือนสำหรับแต่ละประเภท
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            ช่องทางการแจ้งเตือน
          </CardTitle>
          <CardDescription>
            เปิด/ปิดการแจ้งเตือนแต่ละประเภทตามช่องทางที่ต้องการ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">ประเภท</TableHead>
                <TableHead>คำอธิบาย</TableHead>
                <TableHead className="text-center w-[120px]">
                  <div className="flex items-center justify-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5" />
                    In-App
                  </div>
                </TableHead>
                <TableHead className="text-center w-[120px]">
                  <div className="flex items-center justify-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preferences.map((pref) => (
                <TableRow key={pref.type}>
                  <TableCell className="font-medium text-sm">
                    {pref.label}
                    {savingType === pref.type && (
                      <Save className="inline h-3 w-3 ml-1.5 animate-pulse text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {pref.description}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={pref.inApp}
                      onCheckedChange={(v) =>
                        handleToggle(pref.type, "inApp", v)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={pref.email}
                      onCheckedChange={(v) =>
                        handleToggle(pref.type, "email", v)
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground">
            💡 การเปลี่ยนแปลงจะมีผลทันที — ไม่ต้องกดบันทึก
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
