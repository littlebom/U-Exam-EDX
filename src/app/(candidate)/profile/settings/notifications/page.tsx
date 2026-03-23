"use client";

import { Bell, Loader2, Mail, Monitor } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface PreferenceItem {
  type: string;
  label: string;
  description: string;
  inApp: boolean;
  email: boolean;
}

export default function NotificationPreferencesPage() {
  const queryClient = useQueryClient();

  const { data: result, isLoading } = useQuery<{ data: PreferenceItem[] }>({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const res = await fetch("/api/v1/notifications/preferences");
      return res.json();
    },
  });

  const preferences = result?.data ?? [];

  const handleToggle = async (
    type: string,
    channel: "inApp" | "email",
    value: boolean
  ) => {
    try {
      const res = await fetch("/api/v1/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, [channel]: value }),
      });
      const json = await res.json();
      if (json.success) {
        queryClient.invalidateQueries({
          queryKey: ["notification-preferences"],
        });
      } else {
        toast.error(json.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            ตั้งค่าแจ้งเตือน
          </h1>
          <p className="text-sm text-muted-foreground">
            เลือกช่องทางการรับแจ้งเตือนตามประเภท
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ช่องทางแจ้งเตือน</CardTitle>
          <CardDescription>
            เปิด/ปิดการรับแจ้งเตือนแต่ละประเภทตามช่องทาง
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-1">
              {/* Header row */}
              <div className="flex items-center gap-4 py-2 px-2 text-xs font-medium text-muted-foreground border-b mb-2">
                <div className="flex-1">ประเภท</div>
                <div className="w-20 text-center flex items-center justify-center gap-1">
                  <Monitor className="h-3 w-3" />
                  In-App
                </div>
                <div className="w-20 text-center flex items-center justify-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </div>
              </div>

              {/* Preference rows */}
              {preferences.map((pref) => (
                <div
                  key={pref.type}
                  className="flex items-center gap-4 py-3 px-2 rounded-md hover:bg-accent/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{pref.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {pref.description}
                    </p>
                  </div>
                  <div className="w-20 flex justify-center">
                    <Switch
                      checked={pref.inApp}
                      onCheckedChange={(v) =>
                        handleToggle(pref.type, "inApp", v)
                      }
                    />
                  </div>
                  <div className="w-20 flex justify-center">
                    <Switch
                      checked={pref.email}
                      onCheckedChange={(v) =>
                        handleToggle(pref.type, "email", v)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
