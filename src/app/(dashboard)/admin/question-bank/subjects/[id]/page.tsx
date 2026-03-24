"use client";

import { useState, useMemo } from "react";
import { extractPlainText } from "@/lib/content-utils";
import { useParams } from "next/navigation";
import {
  Plus,
  Search,
  Loader2,
  ChevronRight,
  BookOpen,
  FileQuestion,
  Settings,
  Pencil,
  Download,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { useList, useDetail, useSimpleList } from "@/hooks/use-api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import type { QuestionType, DifficultyLevel, QuestionStatus } from "@/types/question-bank";
import {
  QUESTION_TYPE_LABELS,
  getDifficultyBadge,
  getStatusBadge,
  getTypeIcon,
} from "@/lib/question-utils";

// ============================================================
// Types
// ============================================================
interface QuestionRow {
  id: string;
  content: unknown;
  type: QuestionType;
  difficulty: DifficultyLevel;
  status: QuestionStatus;
  points: number;
  createdAt: string;
  questionGroup: { id: string; name: string; color: string | null } | null;
  createdBy: { id: string; name: string; email: string };
  questionTags: { tag: { id: string; name: string; color: string | null } }[];
}

interface CompetencyAreaOption {
  id: string;
  name: string;
  color: string | null;
}

interface QuestionGroupFilterItem {
  id: string;
  name: string;
  color: string | null;
}

interface SubjectDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  category: {
    id: string;
    name: string;
    parent: { id: string; name: string } | null;
  } | null;
  _count: { questions: number };
}

// ============================================================
// Page component
// ============================================================
export default function SubjectDetailPage() {
  const params = useParams();
  const subjectId = params.id as string;

  // ── Subject detail ──
  const {
    data: subject,
    isLoading: subjectLoading,
  } = useDetail<SubjectDetail>(
    `subject-${subjectId}`,
    `/api/v1/subjects/${subjectId}`
  );

  // ── Filters ──
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterGroup, setFilterGroup] = useState<string>("ALL");

  // ── Question groups for this subject ──
  const { data: questionGroups } = useSimpleList<QuestionGroupFilterItem>(
    `question-groups-${subjectId}`,
    `/api/v1/subjects/${subjectId}/question-groups`
  );

  // ── Competency areas (from all frameworks) ──
  const { data: competencyFrameworks } = useSimpleList<{
    id: string;
    name: string;
    areas: CompetencyAreaOption[];
  }>("competency-frameworks", "/api/v1/competency-frameworks");

  const allCompetencyAreas: CompetencyAreaOption[] = useMemo(() => {
    if (!competencyFrameworks) return [];
    return competencyFrameworks.flatMap((fw) => fw.areas ?? []);
  }, [competencyFrameworks]);

  const queryClient = useQueryClient();

  const handleCompetencyMap = async (questionId: string, competencyAreaId: string | null) => {
    try {
      const res = await fetch("/api/v1/questions/competency-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, competencyAreaId }),
      });
      const json = await res.json();
      if (json.success) {
        queryClient.invalidateQueries({ queryKey: [`questions-subject-${subjectId}`] });
      } else {
        toast.error(json.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  // ── Questions list (filtered by subjectId) ──
  const filterParams = useMemo(() => {
    const p: Record<string, string | number | undefined> = {
      perPage: 50,
      subjectId,
    };
    if (searchText) p.search = searchText;
    if (filterType !== "ALL") p.type = filterType;
    if (filterDifficulty !== "ALL") p.difficulty = filterDifficulty;
    if (filterStatus !== "ALL") p.status = filterStatus;
    if (filterGroup !== "ALL") p.questionGroupId = filterGroup;
    return p;
  }, [subjectId, searchText, filterType, filterDifficulty, filterStatus, filterGroup]);

  const {
    data: result,
    isLoading: questionsLoading,
  } = useList<QuestionRow>("questions", "/api/v1/questions", filterParams);

  const questions = result?.data ?? [];

  // ── Loading state ──
  if (subjectLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <h3 className="mb-1 text-lg font-medium">ไม่พบวิชา</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          วิชานี้อาจถูกลบไปแล้ว หรือ URL ไม่ถูกต้อง
        </p>
        <Link href="/admin/question-bank">
          <Button variant="outline">กลับหน้าคลังข้อสอบ</Button>
        </Link>
      </div>
    );
  }

  // ── Stats ──
  const easyCount = questions.filter((q) => q.difficulty === "EASY").length;
  const mediumCount = questions.filter((q) => q.difficulty === "MEDIUM").length;
  const hardCount = questions.filter((q) => q.difficulty === "HARD").length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/admin/question-bank"
          className="hover:text-foreground transition-colors"
        >
          คลังข้อสอบ
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{subject.name}</span>
      </nav>

      {/* Subject Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className="mt-1 h-4 w-4 rounded-full shrink-0"
            style={{ backgroundColor: subject.color ?? "#6B7280" }}
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {subject.name}
              </h1>
              <Badge variant="outline" className="text-xs">
                {subject.code}
              </Badge>
            </div>
            {subject.description && (
              <p className="text-sm text-muted-foreground max-w-2xl">
                {subject.description}
              </p>
            )}
            {subject.category && (
              <p className="text-xs text-muted-foreground mt-1">
                {subject.category.parent
                  ? `${subject.category.parent.name} › ${subject.category.name}`
                  : subject.category.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href={`/admin/question-bank/import?subjectId=${subjectId}`}>
              <Upload className="h-4 w-4" />
              นำเข้า
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              window.open(`/api/v1/questions/export?subjectId=${subjectId}`, "_blank");
            }}
          >
            <Download className="h-4 w-4" />
            ส่งออก
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href={`/question-bank/subjects/${subjectId}/settings`}>
              <Settings className="h-4 w-4" />
              ตั้งค่า
            </Link>
          </Button>
          <Button size="sm" className="gap-1.5" asChild>
            <Link href={`/question-bank/subjects/${subjectId}/create`}>
              <Plus className="h-4 w-4" />
              เพิ่มข้อสอบ
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileQuestion className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ข้อสอบทั้งหมด</p>
                <p className="text-2xl font-bold">{subject._count.questions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">ง่าย</p>
              <p className="text-2xl font-bold text-green-600">{easyCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">ปานกลาง</p>
              <p className="text-2xl font-bold text-amber-600">{mediumCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">ยาก</p>
              <p className="text-2xl font-bold text-red-600">{hardCount}</p>
            </div>
          </CardContent>
        </Card>
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
            <Select
              value={filterDifficulty}
              onValueChange={setFilterDifficulty}
            >
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
            {questionGroups && questionGroups.length > 0 && (
              <Select value={filterGroup} onValueChange={setFilterGroup}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="กลุ่ม" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทุกกลุ่ม</SelectItem>
                  {questionGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      <span className="flex items-center gap-2">
                        {g.color && (
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: g.color }}
                          />
                        )}
                        {g.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            ข้อสอบในวิชานี้ ({questions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {questionsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileQuestion className="mb-4 h-16 w-16 text-muted-foreground/30" />
              <h3 className="mb-1 text-lg font-medium">
                ยังไม่มีข้อสอบในวิชานี้
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                เริ่มต้นสร้างข้อสอบข้อแรกเพื่อเพิ่มเข้าวิชา {subject.name}
              </p>
              <Button asChild>
                <Link href={`/question-bank/subjects/${subjectId}/create`}>
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่มข้อสอบ
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="min-w-[200px]">คำถาม</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>ระดับ</TableHead>
                  <TableHead>กลุ่ม</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ผู้สร้าง</TableHead>
                  <TableHead className="text-right">วันที่</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((q, idx) => (
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
                      {q.questionGroup ? (
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          {q.questionGroup.color && (
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: q.questionGroup.color }}
                            />
                          )}
                          {q.questionGroup.name}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                      >
                        <Link
                          href={`/admin/question-bank/subjects/${subjectId}/${q.id}/edit`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
