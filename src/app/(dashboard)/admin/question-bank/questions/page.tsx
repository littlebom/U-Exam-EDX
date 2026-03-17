"use client";

import { useState, useMemo } from "react";
import { extractPlainText } from "@/lib/content-utils";
import {
  Plus,
  Search,
  Loader2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useList } from "@/hooks/use-api";
import Link from "next/link";
import { createQuestionAction } from "@/actions/question.actions";
import { toast } from "sonner";
import type { QuestionType, DifficultyLevel, QuestionStatus } from "@/types/question-bank";
import {
  QUESTION_TYPE_LABELS,
  getDifficultyBadge,
  getStatusBadge,
  getTypeIcon,
} from "@/lib/question-utils";

interface QuestionRow {
  id: string;
  content: unknown;
  type: QuestionType;
  difficulty: DifficultyLevel;
  status: QuestionStatus;
  points: number;
  createdAt: string;
  subject: { id: string; code: string; name: string } | null;
  category: { id: string; name: string } | null;
  createdBy: { id: string; name: string; email: string };
  questionTags: { tag: { id: string; name: string; color: string | null } }[];
}

export default function AllQuestionsPage() {
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("MULTIPLE_CHOICE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build query params for API
  const filterParams = useMemo(() => {
    const params: Record<string, string | number | undefined> = { perPage: 50 };
    if (searchText) params.search = searchText;
    if (filterType !== "ALL") params.type = filterType;
    if (filterDifficulty !== "ALL") params.difficulty = filterDifficulty;
    if (filterStatus !== "ALL") params.status = filterStatus;
    return params;
  }, [searchText, filterType, filterDifficulty, filterStatus]);

  const { data: result, isLoading, refetch } = useList<QuestionRow>(
    "questions",
    "/api/v1/questions",
    filterParams
  );

  const questions = result?.data ?? [];

  // Form state for creating questions
  const [formContent, setFormContent] = useState("");
  const [formDifficulty, setFormDifficulty] = useState("MEDIUM");

  const handleCreateQuestion = async () => {
    if (!formContent.trim()) {
      toast.error("กรุณาระบุเนื้อหาคำถาม");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createQuestionAction({
        type: activeTab,
        content: { type: "text", text: formContent },
        difficulty: formDifficulty,
        status: "DRAFT",
      });

      if (result.success) {
        toast.success("สร้างข้อสอบสำเร็จ");
        setDialogOpen(false);
        setFormContent("");
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">คลังข้อสอบ</h1>
          <p className="text-sm text-muted-foreground">
            จัดการข้อสอบทั้งหมดในระบบ
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              เพิ่มข้อสอบ
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>เพิ่มข้อสอบใหม่</DialogTitle>
              <DialogDescription>
                เลือกประเภทข้อสอบและกรอกรายละเอียด
              </DialogDescription>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full flex-wrap h-auto">
                <TabsTrigger value="MULTIPLE_CHOICE">ปรนัย</TabsTrigger>
                <TabsTrigger value="TRUE_FALSE">ถูก/ผิด</TabsTrigger>
                <TabsTrigger value="SHORT_ANSWER">ตอบสั้น</TabsTrigger>
                <TabsTrigger value="ESSAY">อัตนัย</TabsTrigger>
                <TabsTrigger value="FILL_IN_BLANK">เติมคำ</TabsTrigger>
                <TabsTrigger value="MATCHING">จับคู่</TabsTrigger>
                <TabsTrigger value="ORDERING">เรียงลำดับ</TabsTrigger>
                <TabsTrigger value="IMAGE_BASED">รูปภาพ</TabsTrigger>
              </TabsList>

              {/* Shared form for all types */}
              <TabsContent value={activeTab} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>เนื้อหาคำถาม</Label>
                  <Textarea
                    placeholder="พิมพ์คำถามที่นี่..."
                    rows={3}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ระดับความยาก</Label>
                    <Select value={formDifficulty} onValueChange={setFormDifficulty}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="เลือกระดับ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EASY">ง่าย</SelectItem>
                        <SelectItem value="MEDIUM">ปานกลาง</SelectItem>
                        <SelectItem value="HARD">ยาก</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>ประเภท</Label>
                    <Input
                      value={QUESTION_TYPE_LABELS[activeTab as QuestionType] ?? activeTab}
                      disabled
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleCreateQuestion} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกข้อสอบ"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหาข้อสอบ..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="ประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกประเภท</SelectItem>
                <SelectItem value="MULTIPLE_CHOICE">ปรนัย</SelectItem>
                <SelectItem value="TRUE_FALSE">ถูก/ผิด</SelectItem>
                <SelectItem value="SHORT_ANSWER">ตอบสั้น</SelectItem>
                <SelectItem value="ESSAY">อัตนัย</SelectItem>
                <SelectItem value="FILL_IN_BLANK">เติมคำ</SelectItem>
                <SelectItem value="MATCHING">จับคู่</SelectItem>
                <SelectItem value="ORDERING">เรียงลำดับ</SelectItem>
                <SelectItem value="IMAGE_BASED">รูปภาพ</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="ระดับ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกระดับ</SelectItem>
                <SelectItem value="EASY">ง่าย</SelectItem>
                <SelectItem value="MEDIUM">ปานกลาง</SelectItem>
                <SelectItem value="HARD">ยาก</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกสถานะ</SelectItem>
                <SelectItem value="DRAFT">แบบร่าง</SelectItem>
                <SelectItem value="ACTIVE">เผยแพร่</SelectItem>
                <SelectItem value="ARCHIVED">เก็บถาวร</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Question Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            ข้อสอบทั้งหมด ({questions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="min-w-[200px]">คำถาม</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>ระดับ</TableHead>
                  <TableHead>วิชา</TableHead>
                  <TableHead>หมวด</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ผู้สร้าง</TableHead>
                  <TableHead className="text-right">วันที่</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="h-24 text-center text-muted-foreground"
                    >
                      ไม่พบข้อสอบที่ตรงกับเงื่อนไข
                    </TableCell>
                  </TableRow>
                ) : (
                  questions.map((q, idx) => (
                    <TableRow key={q.id}>
                      <TableCell className="text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[280px] font-medium truncate">
                          {extractPlainText(q.content) || (
                            <span className="italic text-muted-foreground">
                              (ไม่มีเนื้อหา)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          {getTypeIcon(q.type)}
                          {QUESTION_TYPE_LABELS[q.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>{getDifficultyBadge(q.difficulty)}</TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {q.subject?.name ?? "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {q.category?.name ?? "-"}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(q.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm">{q.createdBy?.name}</span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(q.createdAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        {q.subject?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <Link
                              href={`/question-bank/subjects/${q.subject.id}/${q.id}/edit`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
