"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Loader2, BookOpen, FileText, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { useDetail, useSimpleList } from "@/hooks/use-api";
import type { SubjectDetail, CategoryItem, QuestionGroupItem, TagItem } from "@/types/question-bank";

import { SubjectInfoSection } from "./_components/subject-info-section";
import { QuestionGroupsSection } from "./_components/question-groups-section";
import { TagsSection } from "./_components/tags-section";
export default function SubjectSettingsPage() {
  const params = useParams();
  const subjectId = params.id as string;

  const { data: subject, isLoading: subjectLoading } =
    useDetail<SubjectDetail>(
      `subject-${subjectId}`,
      `/api/v1/subjects/${subjectId}`
    );

  const { data: groups, isLoading: groupsLoading } =
    useSimpleList<QuestionGroupItem>(
      `question-groups-${subjectId}`,
      `/api/v1/subjects/${subjectId}/question-groups`
    );

  const { data: tags, isLoading: tagsLoading } = useSimpleList<TagItem>(
    "tags",
    "/api/v1/tags"
  );

  const { data: categories } = useSimpleList<CategoryItem>(
    "categories",
    "/api/v1/categories"
  );

  // ── Loading ──
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
        <Link href="/admin/question-bank">
          <Button variant="outline">กลับหน้าคลังข้อสอบ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/admin/question-bank"
          className="transition-colors hover:text-foreground"
        >
          คลังข้อสอบ
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/question-bank/subjects/${subjectId}`}
          className="transition-colors hover:text-foreground"
        >
          {subject.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">ตั้งค่า</span>
      </nav>

      {/* Page Title + Back button */}
      <div className="flex items-center gap-4">
        <Link href={`/question-bank/subjects/${subjectId}`}>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ตั้งค่าวิชา</h1>
          <p className="text-sm text-muted-foreground">
            {subject.name} ({subject.code})
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList variant="line">
          <TabsTrigger value="info" className="gap-1.5">
            <FileText className="h-4 w-4" />
            ข้อมูลวิชา
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-1.5">
            <BookOpen className="h-4 w-4" />
            กลุ่มข้อสอบ
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-1.5">
            <Tag className="h-4 w-4" />
            แท็ก
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="pt-6">
          <SubjectInfoSection
            subjectId={subjectId}
            subject={subject}
            categories={categories}
          />
        </TabsContent>

        <TabsContent value="groups" className="pt-6">
          <QuestionGroupsSection
            subjectId={subjectId}
            groups={groups}
            isLoading={groupsLoading}
          />
        </TabsContent>

        <TabsContent value="tags" className="pt-6">
          <TagsSection tags={tags} isLoading={tagsLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
