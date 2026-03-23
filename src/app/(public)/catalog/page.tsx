"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar, Users, Loader2 } from "lucide-react";
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

interface CatalogItem {
  id: string;
  examType: string;
  startDate: string;
  endDate: string;
  maxCandidates: number | null;
  registrationFee: number;
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
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          เปิดรับสมัคร
        </Badge>
      );
    case "closing_soon":
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          ใกล้ปิดรับ
        </Badge>
      );
    case "full":
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
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

export default function CatalogPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useQuery<CatalogResponse>({
    queryKey: ["catalog", searchQuery, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), perPage: "20" });
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/v1/catalog?${params}`);
      if (!res.ok) throw new Error("Failed to load catalog");
      return res.json();
    },
  });

  const items = result?.data ?? [];
  const meta = result?.meta;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          รายการสอบ
        </h1>
        <p className="mt-2 text-muted-foreground">
          ค้นหาและสมัครสอบที่คุณสนใจ
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ค้นหาชื่อสอบ..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="pl-10"
        />
      </div>

      {/* Results Info */}
      <div className="mb-4">
        {meta && (
          <p className="text-sm text-muted-foreground">
            พบ {meta.total} รายการ
          </p>
        )}
      </div>

      {/* Exam Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">ไม่พบรายการสอบ</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            ยังไม่มีรายการสอบที่เปิดรับสมัครในขณะนี้
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const status = getExamStatus(item);
            const remaining = (item.maxCandidates ?? 999) - item._count.registrations;

            return (
              <Card
                key={item.id}
                className={cn(
                  "transition-shadow hover:shadow-md",
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
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(item.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>
                        ที่นั่งว่าง {Math.max(remaining, 0)}/{item.maxCandidates ?? "ไม่จำกัด"}
                      </span>
                    </div>
                    {item.examType === "ONLINE" ? (
                      <p className="text-xs text-blue-600 font-medium">🌐 สอบออนไลน์</p>
                    ) : item.location ? (
                      <p className="text-xs">📍 {item.location}</p>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-normal">
                        {item.examType === "ONLINE" ? "Online" : "Onsite"}
                      </Badge>
                      <Badge variant="outline" className="font-normal">
                        {item.exam.mode === "PUBLIC" ? "สอบสาธารณะ" : "องค์กร"}
                      </Badge>
                      <Badge variant="outline" className="font-normal">
                        {item.exam.duration} นาที
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">
                    {item.registrationFee > 0
                      ? `฿${item.registrationFee.toLocaleString()}`
                      : "ฟรี"}
                  </span>
                  <Button
                    size="sm"
                    disabled={status === "full"}
                    onClick={() => router.push(`/catalog/${item.id}`)}
                  >
                    {status === "full" ? "เต็มแล้ว" : "สมัครสอบ"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
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
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            ถัดไป
          </Button>
        </div>
      )}
    </div>
  );
}
