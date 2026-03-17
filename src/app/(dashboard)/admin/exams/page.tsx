"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Copy,
  FileText,
  Play,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useList } from "@/hooks/use-api";
import { createExamAction, cloneExamAction } from "@/actions/exam.actions";
import { toast } from "sonner";

type ExamStatus = "DRAFT" | "PUBLISHED" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

interface ExamRow {
  id: string;
  title: string;
  description: string | null;
  status: ExamStatus;
  mode: string;
  totalPoints: number;
  passingScore: number;
  duration: number;
  createdAt: string;
  _count: { sections: number; schedules: number };
  createdBy: { name: string };
}

function getExamStatusBadge(status: ExamStatus) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="secondary">แบบร่าง</Badge>;
    case "PUBLISHED":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
        >
          เผยแพร่
        </Badge>
      );
    case "ACTIVE":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        >
          กำลังดำเนินการ
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          เสร็จสิ้น
        </Badge>
      );
    case "ARCHIVED":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          เก็บถาวร
        </Badge>
      );
  }
}

function formatDuration(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins} นาที`;
  if (mins === 0) return `${hrs} ชม.`;
  return `${hrs} ชม. ${mins} น.`;
}

export default function ExamsPage() {
  const [searchText, setSearchText] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDuration, setFormDuration] = useState("60");
  const [formPassingScore, setFormPassingScore] = useState("50");

  const filterParams: Record<string, string | number | undefined> = {
    search: searchText || undefined,
    perPage: 50,
  };

  const { data, isLoading, refetch } = useList<ExamRow>(
    "exams",
    "/api/v1/exams",
    filterParams
  );

  const exams = data?.data ?? [];

  const total = exams.length;
  const active = exams.filter((e) => e.status === "ACTIVE").length;
  const completed = exams.filter((e) => e.status === "COMPLETED").length;
  const draft = exams.filter((e) => e.status === "DRAFT").length;

  const statCards = [
    {
      title: "ทั้งหมด",
      value: total,
      icon: FileText,
      color: "text-foreground",
      bg: "bg-primary/10",
    },
    {
      title: "กำลังดำเนินการ",
      value: active,
      icon: Play,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "เสร็จสิ้น",
      value: completed,
      icon: CheckCircle2,
      color: "text-muted-foreground",
      bg: "bg-muted",
    },
    {
      title: "แบบร่าง",
      value: draft,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
  ];

  const handleCreateExam = async () => {
    if (!formTitle.trim()) {
      toast.error("กรุณาระบุชื่อชุดสอบ");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createExamAction({
        title: formTitle,
        description: formDescription || null,
        duration: parseInt(formDuration) || 60,
        passingScore: parseInt(formPassingScore) || 50,
      });

      if (result.success) {
        toast.success("สร้างชุดสอบสำเร็จ");
        setDialogOpen(false);
        setFormTitle("");
        setFormDescription("");
        setFormDuration("60");
        setFormPassingScore("50");
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

  const handleCloneExam = async (examId: string) => {
    try {
      const result = await cloneExamAction(examId);
      if (result.success) {
        toast.success("คัดลอกชุดสอบสำเร็จ");
        refetch();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
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
          <h1 className="text-2xl font-bold tracking-tight">ชุดข้อสอบ</h1>
          <p className="text-sm text-muted-foreground">
            จัดการชุดข้อสอบและการตั้งค่าสอบ
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              สร้างชุดสอบ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>สร้างชุดสอบใหม่</DialogTitle>
              <DialogDescription>
                กรอกข้อมูลเบื้องต้นเพื่อสร้างชุดสอบ
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ชื่อชุดสอบ</Label>
                <Input
                  placeholder="เช่น IT Fundamentals Exam"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ระยะเวลา (นาที)</Label>
                  <Input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>คะแนนผ่าน (%)</Label>
                  <Input
                    type="number"
                    value={formPassingScore}
                    onChange={(e) => setFormPassingScore(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleCreateExam} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังสร้าง...
                  </>
                ) : (
                  "สร้างชุดสอบ"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                {card.title}
              </CardDescription>
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md",
                  card.bg
                )}
              >
                <card.icon className={cn("h-4 w-4", card.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ค้นหาชุดสอบ..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            รายการชุดสอบ ({exams.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">ชื่อชุดสอบ</TableHead>
                <TableHead className="text-center">ส่วน</TableHead>
                <TableHead className="text-center">ระยะเวลา</TableHead>
                <TableHead className="text-center">คะแนนผ่าน</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ผู้สร้าง</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    ไม่พบชุดสอบที่ตรงกับเงื่อนไข
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{exam.title}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[280px]">
                          {exam.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {exam._count.sections} ส่วน
                    </TableCell>
                    <TableCell className="text-center">
                      {formatDuration(exam.duration)}
                    </TableCell>
                    <TableCell className="text-center">
                      {exam.passingScore}%
                    </TableCell>
                    <TableCell>{getExamStatusBadge(exam.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {exam.createdBy.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                          <Link href={`/exams/${exam.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">ดูตัวอย่าง</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                          <Link href={`/exams/${exam.id}`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">แก้ไข</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleCloneExam(exam.id)}
                        >
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">คัดลอก</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
