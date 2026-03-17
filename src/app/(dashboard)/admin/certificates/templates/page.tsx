"use client";

import { useQuery } from "@tanstack/react-query";
import { LayoutTemplate, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Gradient colors for template previews
const GRADIENTS = [
  "from-amber-700 via-amber-600 to-yellow-500",
  "from-blue-700 via-blue-500 to-cyan-400",
  "from-gray-800 via-gray-700 to-gray-500",
  "from-emerald-700 via-emerald-500 to-teal-400",
  "from-purple-700 via-purple-500 to-pink-400",
  "from-red-700 via-red-500 to-orange-400",
];

type TemplateItem = {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  certificateCount: number;
  createdAt: string;
};

export default function CertificateTemplatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["certificate-templates"],
    queryFn: async () => {
      const res = await fetch("/api/v1/certificates/templates");
      const json = await res.json();
      return json;
    },
  });

  const templates: TemplateItem[] = data?.data ?? [];

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
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <LayoutTemplate className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            เทมเพลต Certificate
          </h1>
          <p className="text-sm text-muted-foreground">
            จัดการเทมเพลตใบรับรอง {templates.length} รายการ
          </p>
        </div>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <LayoutTemplate className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              ยังไม่มีเทมเพลต — สร้างเทมเพลตแรกเพื่อเริ่มออกใบรับรอง
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((tpl, idx) => (
            <Card key={tpl.id} className="flex flex-col">
              <div
                className={cn(
                  "flex h-48 items-center justify-center rounded-t-lg bg-gradient-to-br",
                  GRADIENTS[idx % GRADIENTS.length]
                )}
              >
                <div className="rounded-md bg-white/20 px-6 py-3 backdrop-blur-sm">
                  <span className="text-lg font-bold text-white">
                    {tpl.name}
                  </span>
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{tpl.name}</CardTitle>
                  <div className="flex gap-1">
                    {tpl.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                    {!tpl.isActive && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        ปิดใช้งาน
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">
                  ออกใบรับรองแล้ว {tpl.certificateCount} ใบ
                </p>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button variant="outline" size="sm" className="w-full gap-1.5">
                  <Pencil className="h-4 w-4" />
                  แก้ไข
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
