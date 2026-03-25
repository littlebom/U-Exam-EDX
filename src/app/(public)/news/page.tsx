"use client";

import Link from "next/link";
import { Calendar, Newspaper, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────

interface PublicNewsItem {
  id: string;
  title: string;
  content: string;
  coverImage: string | null;
  publishedAt: string | null;
  createdAt: string;
  tenant: { name: string; logoUrl: string | null };
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Page ───────────────────────────────────────────────────────────

export default function NewsPage() {
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useQuery<{
    data: PublicNewsItem[];
    meta: { page: number; perPage: number; total: number; totalPages: number };
  }>({
    queryKey: ["public-news", page],
    queryFn: async () => {
      const res = await fetch(`/api/v1/public/news?page=${page}&perPage=12`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const newsItems = result?.data ?? [];
  const meta = result?.meta;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          ข่าวสารและประกาศ
        </h1>
        <p className="mt-2 text-muted-foreground">
          ติดตามข่าวสาร ประกาศ และอัปเดตล่าสุดจาก U-Exam
        </p>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : newsItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Newspaper className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-base">ยังไม่มีข่าวสาร</p>
        </div>
      ) : (
        <>
          {/* News Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {newsItems.map((item) => (
              <Link key={item.id} href={`/news/${item.id}`}>
              <Card
                className="flex flex-col transition-shadow hover:shadow-md cursor-pointer h-full"
              >
                {item.coverImage && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Newspaper className="h-4 w-4 text-primary" />
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      {item.tenant.name}
                    </Badge>
                  </div>
                  <CardTitle className="mt-3 text-base leading-snug">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription className="text-sm leading-relaxed line-clamp-3">
                    {item.content.replace(/<[^>]*>/g, "")}
                  </CardDescription>
                </CardContent>
                <div className="px-6 pb-5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(item.publishedAt ?? item.createdAt)}
                  </div>
                </div>
              </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-8">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ก่อนหน้า
              </Button>
              <span className="text-sm text-muted-foreground">
                หน้า {meta.page} จาก {meta.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                ถัดไป
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
