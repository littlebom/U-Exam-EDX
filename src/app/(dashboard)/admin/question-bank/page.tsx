"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  BookOpen,
  FileQuestion,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";

interface SubjectItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  category: { id: string; name: string } | null;
  _count: { questions: number };
}

interface CategoryItem {
  id: string;
  name: string;
}

const COLORS = [
  { value: "#3B82F6", label: "น้ำเงิน" },
  { value: "#10B981", label: "เขียว" },
  { value: "#F59E0B", label: "เหลือง" },
  { value: "#EF4444", label: "แดง" },
  { value: "#8B5CF6", label: "ม่วง" },
  { value: "#EC4899", label: "ชมพู" },
  { value: "#14B8A6", label: "เขียวเข้ม" },
  { value: "#F97316", label: "ส้ม" },
];

export default function QuestionBankPage() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState("#3B82F6");
  const [formCategoryId, setFormCategoryId] = useState<string>("none");

  const { data: subjectsData, isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await fetch("/api/v1/subjects");
      const json = await res.json();
      return json;
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/v1/categories");
      const json = await res.json();
      return json;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formCode,
          name: formName,
          description: formDescription || null,
          color: formColor,
          categoryId: formCategoryId !== "none" ? formCategoryId : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "เกิดข้อผิดพลาด");
      }
      return res.json();
    },
    onSuccess: () => {
      setShowCreateDialog(false);
      setFormCode("");
      setFormName("");
      setFormDescription("");
      setFormColor("#3B82F6");
      setFormCategoryId("none");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("สร้างวิชาสำเร็จ");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const subjects: SubjectItem[] = subjectsData?.data ?? [];
  const categories: CategoryItem[] = categoriesData?.data ?? [];

  const totalQuestions = subjects.reduce(
    (sum, s) => sum + s._count.questions,
    0
  );

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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">คลังข้อสอบ</h1>
          <p className="text-sm text-muted-foreground">
            จัดการวิชาและข้อสอบทั้งหมดในระบบ
          </p>
        </div>
        <Button className="gap-1.5" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          เพิ่มวิชา
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">วิชาทั้งหมด</p>
                <p className="text-2xl font-bold">{subjects.length}</p>
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
                <p className="text-sm text-muted-foreground">ข้อสอบทั้งหมด</p>
                <p className="text-2xl font-bold">{totalQuestions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">หมวดหมู่</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Grid */}
      {subjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <h3 className="mb-1 text-lg font-medium">ยังไม่มีวิชา</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              เริ่มต้นสร้างวิชาแรกเพื่อจัดกลุ่มข้อสอบของคุณ
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มวิชา
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/question-bank/subjects/${subject.id}`}
            >
              <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: subject.color ?? "#6B7280",
                      }}
                    />
                    <Badge variant="outline" className="text-xs">
                      {subject.code}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {subject.name}
                  </CardTitle>
                  {subject.description && (
                    <CardDescription className="line-clamp-2">
                      {subject.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileQuestion className="h-3.5 w-3.5" />
                      <span>{subject._count.questions} ข้อสอบ</span>
                    </div>
                    {subject.category && (
                      <span className="truncate max-w-[150px]">
                        {subject.category.name}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Subject Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่มวิชาใหม่</DialogTitle>
            <DialogDescription>
              ระบุรหัสวิชาและชื่อวิชาเพื่อจัดกลุ่มข้อสอบ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">รหัสวิชา</Label>
                <Input
                  id="code"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="CS101"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">ชื่อวิชา</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="เช่น โครงสร้างข้อมูล"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">คำอธิบาย (ไม่บังคับ)</Label>
              <Textarea
                id="desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="คำอธิบายวิชา..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>หมวดหมู่ (ไม่บังคับ)</Label>
              <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ไม่ระบุ</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>สี</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFormColor(c.value)}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      formColor === c.value
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={
                !formCode.trim() ||
                !formName.trim() ||
                createMutation.isPending
              }
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              สร้างวิชา
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
