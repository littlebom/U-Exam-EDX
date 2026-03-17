"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Calendar,
  Users,
  Loader2,
  Clock,
  Award,
  MapPin,
  BookOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

// ─── Types ──────────────────────────────────────────────────────────

interface CatalogItem {
  id: string;
  startDate: string;
  endDate: string;
  maxCandidates: number | null;
  status: string;
  location: string | null;
  exam: {
    id: string;
    title: string;
    description: string | null;
    mode: string;
    duration: number;
    passingScore: number | null;
  };
  tenant: { id: string; name: string };
  _count: { registrations: number };
}

interface CatalogResponse {
  success: boolean;
  data: CatalogItem[];
  meta: { page: number; perPage: number; total: number; totalPages: number };
}

// ─── Helpers ────────────────────────────────────────────────────────

function getExamStatus(item: CatalogItem) {
  const maxSeats = item.maxCandidates ?? 999;
  const taken = item._count.registrations;
  const remaining = maxSeats - taken;

  if (remaining <= 0) return "full";
  if (remaining <= maxSeats * 0.15) return "closing_soon";
  return "open";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "open":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        >
          เปิดรับสมัคร
        </Badge>
      );
    case "closing_soon":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
        >
          ใกล้ปิดรับ
        </Badge>
      );
    case "full":
      return (
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        >
          เต็มแล้ว
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Page ───────────────────────────────────────────────────────────

export default function ExamCatalogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useQuery<CatalogResponse>({
    queryKey: ["candidate-catalog", searchQuery, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: "12",
      });
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/v1/catalog?${params}`);
      if (!res.ok) throw new Error("Failed to load catalog");
      return res.json();
    },
  });

  const items = result?.data ?? [];
  const meta = result?.meta;

  // Stats
  const openCount = items.filter((i) => getExamStatus(i) === "open").length;
  const closingSoonCount = items.filter(
    (i) => getExamStatus(i) === "closing_soon"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">รายวิชาสอบ</h1>
        <p className="text-sm text-muted-foreground">
          ค้นหารายวิชาที่เปิดรับสมัครสอบ และลงทะเบียนสอบได้ทันที
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ค้นหาชื่อรายวิชา..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      {!isLoading && meta && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  รายวิชาทั้งหมด
                </span>
                <span className="text-2xl font-bold">{meta.total}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  เปิดรับสมัคร
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {openCount}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  ใกล้ปิดรับ
                </span>
                <span className="text-2xl font-bold text-amber-600">
                  {closingSoonCount}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Exam Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BookOpen className="mb-3 h-10 w-10 opacity-50" />
            <p className="font-medium">ไม่พบรายวิชาสอบ</p>
            <p className="mt-1 text-sm">
              {searchQuery
                ? "ลองค้นหาด้วยคำอื่น"
                : "ยังไม่มีรายวิชาที่เปิดรับสมัครในขณะนี้"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const status = getExamStatus(item);
            const remaining =
              (item.maxCandidates ?? 999) - item._count.registrations;

            return (
              <Card
                key={item.id}
                className={cn(
                  "flex flex-col transition-shadow hover:shadow-md",
                  status === "full" && "opacity-75"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">
                      {item.exam.title}
                    </CardTitle>
                    {getStatusBadge(status)}
                  </div>
                  <CardDescription>{item.tenant.name}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>
                        {formatDate(item.startDate)} ·{" "}
                        {formatTime(item.startDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>{item.exam.duration} นาที</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 shrink-0" />
                      <span>
                        ที่นั่งว่าง {Math.max(remaining, 0)}/
                        {item.maxCandidates ?? "ไม่จำกัด"}
                      </span>
                    </div>
                    {item.exam.passingScore && (
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 shrink-0" />
                        <span>คะแนนผ่าน {item.exam.passingScore}%</span>
                      </div>
                    )}
                    {item.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Badge variant="outline" className="font-normal">
                        {item.exam.mode === "PUBLIC"
                          ? "สอบสาธารณะ"
                          : "องค์กร"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    disabled={status === "full"}
                    asChild={status !== "full"}
                  >
                    {status === "full" ? (
                      "ที่นั่งเต็มแล้ว"
                    ) : (
                      <Link href={`/catalog/${item.id}`}>ดูรายละเอียด & ลงทะเบียน</Link>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            หน้า {meta.page} จาก {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ก่อนหน้า
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
