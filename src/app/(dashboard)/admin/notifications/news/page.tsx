"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Newspaper,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  coverImage: string | null;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NewsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<NewsItem | null>(null);
  const qc = useQueryClient();

  const params = new URLSearchParams({
    page: String(page),
    perPage: "20",
  });
  if (search) params.set("search", search);
  if (statusFilter !== "all") params.set("status", statusFilter);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-news", page, search, statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/v1/news?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const newsItems: NewsItem[] = data?.data ?? [];
  const meta = data?.meta;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/v1/news/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("ลบข่าวสำเร็จ");
        qc.invalidateQueries({ queryKey: ["admin-news"] });
      } else {
        toast.error(json.error?.message ?? "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ข่าวสาร</h1>
          <p className="text-sm text-muted-foreground">
            จัดการข่าวสารเพื่อแสดงในหน้าเว็บไซต์
          </p>
        </div>
        <Link href="/admin/notifications/news/create">
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            สร้างข่าวสาร
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาข่าว..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            <SelectItem value="PUBLISHED">เผยแพร่</SelectItem>
            <SelectItem value="DRAFT">แบบร่าง</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            รายการข่าวสาร
          </CardTitle>
          <CardDescription>
            {meta ? `ทั้งหมด ${meta.total} รายการ` : "กำลังโหลด..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : newsItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Newspaper className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">ยังไม่มีข่าวสาร</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>หัวข้อ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ผู้สร้าง</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newsItems.map((news) => (
                  <TableRow key={news.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {news.coverImage && (
                          <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="font-medium line-clamp-1">
                          {news.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {news.status === "PUBLISHED" ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          เผยแพร่
                        </Badge>
                      ) : (
                        <Badge variant="secondary">แบบร่าง</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {news.createdBy?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(news.publishedAt ?? news.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/notifications/news/${news.id}/edit`}>
                          <Button variant="ghost" size="sm" className="gap-1 text-xs">
                            <Pencil className="h-3 w-3" />
                            แก้ไข
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-red-600 hover:text-red-700"
                          onClick={() => setDeleteTarget(news)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                หน้า {meta.page} จาก {meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ก่อนหน้า
                </Button>
                <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบข่าวสาร</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบ &quot;{deleteTarget?.title}&quot; หรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
