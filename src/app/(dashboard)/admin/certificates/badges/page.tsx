"use client";

import { useState } from "react";
import { BadgeTemplateManager } from "@/components/badges/badge-template-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Award,
  Loader2,
  ExternalLink,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Image as ImageIcon,
  FileJson,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";

// ─── Types ──────────────────────────────────────────────────────────

interface BadgeItem {
  id: string;
  badgeUrl: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  certificate: {
    id: string;
    certificateNumber: string;
    status: string;
    issuedAt: string;
    expiresAt: string | null;
    candidate: { name: string; email: string };
    grade: {
      percentage: number;
      session: {
        examSchedule: {
          exam: { title: string };
        };
      };
    } | null;
  };
}

// ─── Page ───────────────────────────────────────────────────────────

export default function BadgesPage() {
  const [page, setPage] = useState(1);
  const [previewBadge, setPreviewBadge] = useState<BadgeItem | null>(null);
  const [previewType, setPreviewType] = useState<"svg" | "json">("svg");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-badges", page],
    queryFn: async () => {
      const res = await fetch(
        `/api/v1/badges?page=${page}&perPage=20`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const badges: BadgeItem[] = data?.data ?? [];
  const meta = data?.meta;

  // Stats
  const totalBadges = meta?.total ?? badges.length;
  const activeBadges = badges.filter(
    (b) => b.certificate.status === "ACTIVE"
  ).length;
  const revokedBadges = badges.filter(
    (b) => b.certificate.status === "REVOKED"
  ).length;

  function getStatusBadge(status: string) {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Active
          </Badge>
        );
      case "REVOKED":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" /> Revoked
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" /> Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Digital Badge (Open Badge 3.0)
        </h1>
        <p className="text-sm text-muted-foreground">
          จัดการ Digital Badge ที่ออกร่วมกับใบรับรอง — รองรับมาตรฐาน Open Badge
          3.0
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="badges">
        <TabsList>
          <TabsTrigger value="badges">รายการ Badge</TabsTrigger>
          <TabsTrigger value="templates">Badge Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="space-y-6 mt-4">

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Badge ทั้งหมด
              </span>
              <span className="text-2xl font-bold">{totalBadges}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active</span>
              <span className="text-2xl font-bold text-green-600">
                {activeBadges}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Revoked</span>
              <span className="text-2xl font-bold text-red-600">
                {revokedBadges}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badge Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" />
            รายการ Badge
          </CardTitle>
          <CardDescription>
            Badge ถูกสร้างอัตโนมัติเมื่อออกใบรับรอง
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : badges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Award className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">ยังไม่มี Badge</p>
              <p className="text-sm">
                Badge จะถูกสร้างอัตโนมัติเมื่อออกใบรับรอง
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Badge</TableHead>
                  <TableHead>ผู้สอบ</TableHead>
                  <TableHead>วิชา</TableHead>
                  <TableHead>คะแนน</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันออก</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {badges.map((badge) => (
                  <TableRow key={badge.id}>
                    <TableCell>
                      <img
                        src={`/api/v1/badges/${badge.certificate.id}/svg`}
                        alt="Badge"
                        className="h-10 w-10 rounded-full"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {badge.certificate.candidate.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {badge.certificate.candidate.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {badge.certificate.grade?.session?.examSchedule?.exam
                        ?.title ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {badge.certificate.grade?.percentage
                        ? `${badge.certificate.grade.percentage}%`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(badge.certificate.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(badge.createdAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={() => {
                            setPreviewBadge(badge);
                            setPreviewType("svg");
                          }}
                        >
                          <ImageIcon className="h-3 w-3" /> ดู Badge
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={() => {
                            setPreviewBadge(badge);
                            setPreviewType("json");
                          }}
                        >
                          <FileJson className="h-3 w-3" /> JSON-LD
                        </Button>
                        <a
                          href={`/api/v1/badges/${badge.certificate.id}/status`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs"
                          >
                            <ShieldCheck className="h-3 w-3" /> Status
                          </Button>
                        </a>
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
        </CardContent>
      </Card>

      </TabsContent>

      <TabsContent value="templates" className="mt-4">
        <BadgeTemplateManager />
      </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewBadge}
        onOpenChange={(open) => !open && setPreviewBadge(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewType === "svg" ? (
                <>
                  <ImageIcon className="h-5 w-5" /> Badge Preview
                </>
              ) : (
                <>
                  <FileJson className="h-5 w-5" /> Open Badge 3.0 JSON-LD
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={previewType === "svg" ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewType("svg")}
            >
              <ImageIcon className="h-3 w-3 mr-1" /> Badge SVG
            </Button>
            <Button
              variant={previewType === "json" ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewType("json")}
            >
              <FileJson className="h-3 w-3 mr-1" /> JSON-LD
            </Button>
          </div>

          {previewBadge && previewType === "svg" && (
            <div className="flex flex-col items-center gap-4">
              <img
                src={`/api/v1/badges/${previewBadge.certificate.id}/svg`}
                alt="Badge"
                className="h-48 w-48"
              />
              <div className="text-center">
                <p className="font-medium">
                  {previewBadge.certificate.candidate.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {previewBadge.certificate.grade?.session?.examSchedule?.exam
                    ?.title ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {previewBadge.certificate.certificateNumber}
                </p>
              </div>
              <a
                href={`/api/v1/badges/${previewBadge.certificate.id}/svg`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-1">
                  <ExternalLink className="h-3 w-3" /> เปิด SVG ในแท็บใหม่
                </Button>
              </a>
            </div>
          )}

          {previewBadge && previewType === "json" && (
            <BadgeJsonPreview certificateId={previewBadge.certificate.id} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── JSON-LD Preview ────────────────────────────────────────────────

function BadgeJsonPreview({ certificateId }: { certificateId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["badge-json", certificateId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/badges/${certificateId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <pre className="bg-muted rounded-lg p-4 text-xs overflow-auto max-h-[400px]">
        {JSON.stringify(data, null, 2)}
      </pre>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(data, null, 2));
          }}
        >
          คัดลอก JSON
        </Button>
        <a
          href={`/api/v1/badges/${certificateId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="sm" className="gap-1">
            <ExternalLink className="h-3 w-3" /> เปิดในแท็บใหม่
          </Button>
        </a>
      </div>
    </div>
  );
}
