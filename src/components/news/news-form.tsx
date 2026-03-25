"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoverImageUpload } from "@/components/upload/cover-image-upload";
import { toast } from "sonner";

const SimpleRichEditor = dynamic(
  () =>
    import("@/components/editor/simple-rich-editor").then(
      (m) => m.SimpleRichEditor
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] rounded-lg border animate-pulse bg-muted" />
    ),
  }
);

interface NewsFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    title: string;
    content: string;
    coverImage: string | null;
    status: string;
  };
}

export function NewsForm({ mode, initialData }: NewsFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [coverImage, setCoverImage] = useState(initialData?.coverImage ?? "");
  const [published, setPublished] = useState(
    initialData?.status === "PUBLISHED"
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("กรุณาระบุหัวข้อข่าว");
      return;
    }
    if (!content.trim() || content === "<p></p>") {
      toast.error("กรุณาระบุเนื้อหา");
      return;
    }

    setIsSaving(true);
    try {
      const body = {
        title,
        content,
        coverImage: coverImage || undefined,
        status: published ? "PUBLISHED" : "DRAFT",
      };

      const url =
        mode === "edit"
          ? `/api/v1/news/${initialData!.id}`
          : "/api/v1/news";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.success) {
        toast.success(
          mode === "edit" ? "แก้ไขข่าวสำเร็จ" : "สร้างข่าวสำเร็จ"
        );
        router.push("/admin/notifications/news");
      } else {
        toast.error(json.error?.message ?? "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/notifications/news">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "edit" ? "แก้ไขข่าวสาร" : "สร้างข่าวสาร"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "edit"
                ? "แก้ไขเนื้อหาข่าวสาร"
                : "สร้างข่าวสารใหม่เพื่อเผยแพร่"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={published}
              onCheckedChange={setPublished}
              id="publish-toggle"
            />
            <Label htmlFor="publish-toggle" className="text-sm">
              {published ? "เผยแพร่ทันที" : "บันทึกเป็นแบบร่าง"}
            </Label>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-1.5">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Left: Content */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">เนื้อหา</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="news-title">หัวข้อข่าว</Label>
                <Input
                  id="news-title"
                  placeholder="หัวข้อข่าวสาร..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label>เนื้อหา</Label>
                <SimpleRichEditor
                  content={content}
                  onChange={setContent}
                  placeholder="พิมพ์เนื้อหาข่าวสาร..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Cover Image */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">รูปปก</CardTitle>
            </CardHeader>
            <CardContent>
              <CoverImageUpload value={coverImage} onChange={setCoverImage} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
