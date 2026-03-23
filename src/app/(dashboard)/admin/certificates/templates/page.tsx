"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutTemplate, Pencil, Plus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { TemplateFormDialog } from "@/components/certificate/template-form-dialog";

type TemplateItem = {
  id: string;
  name: string;
  design: {
    logoUrl?: string | null;
    primaryColor?: string;
  } | null;
  isDefault: boolean;
  isActive: boolean;
  certificateCount: number;
  createdAt: string;
};

export default function CertificateTemplatesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TemplateItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["certificate-templates"],
    queryFn: async () => {
      const res = await fetch("/api/v1/certificates/templates");
      const json = await res.json();
      return json;
    },
  });

  const templates: TemplateItem[] = data?.data ?? [];

  const handleEdit = (id: string) => {
    setEditId(id);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditId(null);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/v1/certificates/templates/${deleteTarget.id}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (json.success) {
        toast.success("ลบเทมเพลตสำเร็จ");
        setDeleteTarget(null);
        queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
      } else {
        toast.error(json.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsDeleting(false);
    }
  };

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        <Button onClick={handleCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          สร้างเทมเพลต
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <LayoutTemplate className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              ยังไม่มีเทมเพลต — สร้างเทมเพลตแรกเพื่อเริ่มออกใบรับรอง
            </p>
            <Button onClick={handleCreate} className="mt-4 gap-1.5">
              <Plus className="h-4 w-4" />
              สร้างเทมเพลต
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((tpl) => {
            const design = tpl.design ?? {};
            const color = design.primaryColor || "#741717";
            const logoUrl = design.logoUrl;
            return (
            <Card key={tpl.id} className="flex flex-col pt-0 overflow-hidden">
              {/* Certificate Style Preview */}
              <div
                className="relative flex aspect-video flex-col items-center justify-start gap-2 rounded-t-lg border-b pt-6"
                style={{ backgroundColor: `${color}0a` }}
              >
                {/* Mini border decoration */}
                <div
                  className="absolute inset-3 rounded border-2"
                  style={{ borderColor: `${color}30` }}
                />
                <div
                  className="absolute inset-4 rounded border"
                  style={{ borderColor: `${color}15` }}
                />
                {/* Logo or text */}
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt=""
                    className="relative z-10 h-12 w-12 object-contain"
                  />
                ) : (
                  <span
                    className="relative z-10 text-lg font-bold"
                    style={{ color }}
                  >
                    U-Exam
                  </span>
                )}
                <span
                  className="relative z-10 text-[10px] font-semibold tracking-[3px] uppercase"
                  style={{ color }}
                >
                  Certificate
                </span>
                {/* Decorative line */}
                <div
                  className="relative z-10 h-0.5 w-16"
                  style={{ backgroundColor: color }}
                />
                <span className="relative z-10 text-xs text-muted-foreground">
                  {tpl.name}
                </span>
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
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
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
              <CardFooter className="gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => handleEdit(tpl.id)}
                >
                  <Pencil className="h-4 w-4" />
                  แก้ไข
                </Button>
                {tpl.certificateCount === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setDeleteTarget(tpl)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <TemplateFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editId={editId}
        onSaved={() =>
          queryClient.invalidateQueries({
            queryKey: ["certificate-templates"],
          })
        }
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบเทมเพลต</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบเทมเพลต &quot;{deleteTarget?.name}&quot; หรือไม่?
              การลบไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
