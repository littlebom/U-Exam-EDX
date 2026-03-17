"use client";

import { useState } from "react";
import {
  Plus,
  FolderOpen,
  Loader2,
  FileQuestion,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSimpleList } from "@/hooks/use-api";
import { createCategoryAction } from "@/actions/category.actions";
import { toast } from "sonner";
import type { CategoryItem } from "@/types/question-bank";

export default function CategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const {
    data: categories,
    isLoading,
    refetch,
  } = useSimpleList<CategoryItem>("categories", "/api/v1/categories");

  const categoryList = Array.isArray(categories) ? categories : [];
  const totalCategories = categoryList.length;
  const totalSubjects =
    categoryList.reduce((sum, cat) => sum + (cat._count?.subjects ?? 0), 0);

  const handleCreateCategory = async () => {
    if (!formName.trim()) {
      toast.error("กรุณาระบุชื่อหมวดหมู่");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createCategoryAction({
        name: formName,
        description: formDescription || null,
      });

      if (result.success) {
        toast.success("สร้างหมวดหมู่สำเร็จ");
        setDialogOpen(false);
        setFormName("");
        setFormDescription("");
        refetch();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            หมวดหมู่ข้อสอบ
          </h1>
          <p className="text-sm text-muted-foreground">
            จัดกลุ่มวิชาตามหมวดหมู่
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              เพิ่มหมวดหมู่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มหมวดหมู่ใหม่</DialogTitle>
              <DialogDescription>
                สร้างหมวดหมู่ใหม่สำหรับจัดกลุ่มวิชา
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ชื่อหมวดหมู่</Label>
                <Input
                  placeholder="เช่น การเขียนโปรแกรม"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>คำอธิบาย</Label>
                <Input
                  placeholder="คำอธิบายสั้น ๆ (ไม่บังคับ)"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleCreateCategory} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกหมวดหมู่"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">หมวดหมู่ทั้งหมด</p>
                <p className="text-2xl font-bold">{totalCategories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileQuestion className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">วิชาทั้งหมด</p>
                <p className="text-2xl font-bold">{totalSubjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Grid */}
      {categoryList.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoryList.map((category) => (
            <Card
              key={category.id}
              className="group transition-all hover:shadow-md hover:border-primary/30"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FolderOpen className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {category._count?.subjects ?? 0} วิชา
                  </Badge>
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {category.name}
                </CardTitle>
                {category.description && (
                  <CardDescription className="line-clamp-2">
                    {category.description}
                  </CardDescription>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <h3 className="mb-1 text-lg font-medium">ยังไม่มีหมวดหมู่</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              กดปุ่ม &quot;เพิ่มหมวดหมู่&quot; เพื่อเริ่มสร้างหมวดหมู่แรก
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มหมวดหมู่
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
