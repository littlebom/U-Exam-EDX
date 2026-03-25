"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DOMPurify from "isomorphic-dompurify";

interface NewsDetail {
  id: string;
  title: string;
  content: string;
  coverImage: string | null;
  publishedAt: string | null;
  createdAt: string;
  createdBy: { name: string } | null;
}

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/v1/public/news/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setNews(json.data);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <p className="text-lg font-medium">ไม่พบข่าวสาร</p>
        <p className="mt-2 text-sm text-muted-foreground">ข่าวนี้อาจถูกลบหรือยังไม่ได้เผยแพร่</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/news")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับหน้าข่าวสาร
        </Button>
      </div>
    );
  }

  const date = news.publishedAt ?? news.createdAt;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link href="/news">
        <Button variant="ghost" size="sm" className="mb-6 gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          กลับหน้าข่าวสาร
        </Button>
      </Link>

      {/* Cover image */}
      {news.coverImage && (
        <div className="mb-6 overflow-hidden rounded-lg">
          <img
            src={news.coverImage}
            alt={news.title}
            className="w-full object-cover"
            style={{ aspectRatio: "16/9" }}
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <Badge variant="secondary" className="mb-3">ข่าวสาร</Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {news.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {new Date(date).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          {news.createdBy?.name && (
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {news.createdBy.name}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="pt-6">
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(news.content) }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
