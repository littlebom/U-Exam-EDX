"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Loader2,
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useDetail, useList } from "@/hooks/use-api";
import { resolveAppealAction } from "@/actions/appeal.actions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────

interface AppealItem {
  id: string;
  sessionId: string;
  questionId: string | null;
  originalScore: number;
  newScore: number | null;
  reason: string;
  response: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  resolvedAt: string | null;
  createdAt: string;
  candidate: { id: string; name: string; email: string };
  session: {
    id: string;
    examSchedule: { exam: { id: string; title: string } };
  };
  resolvedBy: { id: string; name: string } | null;
}

interface AppealStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
        >
          <Clock className="mr-1 h-3 w-3" />
          รอดำเนินการ
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        >
          <CheckCircle2 className="mr-1 h-3 w-3" />
          อนุมัติ
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        >
          <XCircle className="mr-1 h-3 w-3" />
          ปฏิเสธ
        </Badge>
      );
    default:
      return null;
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function GradingAppealsPage() {
  const [selectedAppeal, setSelectedAppeal] = useState<AppealItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [responseNote, setResponseNote] = useState("");
  const [newScore, setNewScore] = useState<string>("");
  const [isResolving, setIsResolving] = useState(false);
  const queryClient = useQueryClient();

  // Fetch appeals
  const { data: appealsData, isLoading } = useList<AppealItem>(
    "appeals",
    "/api/v1/appeals",
    { perPage: 50 }
  );

  // Fetch stats
  const { data: stats } = useDetail<AppealStats>("appeal-stats", "/api/v1/appeals/stats");

  const appeals = appealsData?.data ?? [];
  const pendingCount = stats?.pending ?? 0;
  const approvedCount = stats?.approved ?? 0;
  const rejectedCount = stats?.rejected ?? 0;

  const handleViewAppeal = useCallback((appeal: AppealItem) => {
    setSelectedAppeal(appeal);
    setResponseNote(appeal.response ?? "");
    setNewScore(appeal.newScore?.toString() ?? "");
    setDialogOpen(true);
  }, []);

  const handleResolve = useCallback(async (action: "APPROVED" | "REJECTED") => {
    if (!selectedAppeal) return;

    if (!responseNote.trim()) {
      toast.error("กรุณาระบุหมายเหตุ");
      return;
    }

    setIsResolving(true);
    try {
      const result = await resolveAppealAction(selectedAppeal.id, {
        status: action,
        response: responseNote,
        newScore: action === "APPROVED" && newScore ? parseFloat(newScore) : undefined,
      });

      if (result.success) {
        toast.success(action === "APPROVED" ? "อนุมัติอุทธรณ์แล้ว" : "ปฏิเสธอุทธรณ์แล้ว");
        setDialogOpen(false);
        setSelectedAppeal(null);
        queryClient.invalidateQueries({ queryKey: ["appeals"] });
        queryClient.invalidateQueries({ queryKey: ["appeal-stats"] });
        queryClient.invalidateQueries({ queryKey: ["grading-stats"] });
      } else {
        toast.error(result.error ?? "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsResolving(false);
    }
  }, [selectedAppeal, responseNote, newScore, queryClient]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/grading">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              คำร้องอุทธรณ์
            </h1>
            <p className="text-sm text-muted-foreground">
              จัดการคำร้องอุทธรณ์คะแนนจากผู้สอบ
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">
              รอดำเนินการ
            </CardDescription>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">
              อนุมัติ
            </CardDescription>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">
              ปฏิเสธ
            </CardDescription>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Appeals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการอุทธรณ์ทั้งหมด</CardTitle>
          <CardDescription>
            ตรวจสอบและดำเนินการคำร้องอุทธรณ์คะแนนสอบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : appeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mb-2" />
              <p className="text-sm">ไม่มีคำร้องอุทธรณ์</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ผู้ยื่น</TableHead>
                  <TableHead>ชุดสอบ</TableHead>
                  <TableHead className="text-center">คะแนนเดิม</TableHead>
                  <TableHead className="hidden md:table-cell">เหตุผล</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appeals.map((appeal) => (
                  <TableRow key={appeal.id}>
                    <TableCell className="font-medium">
                      {appeal.candidate.name}
                    </TableCell>
                    <TableCell>{appeal.session.examSchedule.exam.title}</TableCell>
                    <TableCell className="text-center">
                      {appeal.originalScore}
                    </TableCell>
                    <TableCell className="hidden max-w-48 truncate md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {appeal.reason}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(appeal.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(appeal.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleViewAppeal(appeal)}
                      >
                        <Eye className="h-4 w-4" />
                        ดูรายละเอียด
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Appeal Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              รายละเอียดคำร้องอุทธรณ์
            </DialogTitle>
            <DialogDescription>
              {selectedAppeal
                ? selectedAppeal.session.examSchedule.exam.title
                : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedAppeal && (
            <div className="space-y-4">
              {/* Info */}
              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">ผู้ยื่นอุทธรณ์</span>
                  <span className="font-medium">
                    {selectedAppeal.candidate.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">ชุดสอบ</span>
                  <span className="font-medium">
                    {selectedAppeal.session.examSchedule.exam.title}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">คะแนนเดิม</span>
                  <span className="font-semibold text-destructive">
                    {selectedAppeal.originalScore}
                  </span>
                </div>
                {selectedAppeal.newScore !== null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">คะแนนใหม่</span>
                    <span className="font-semibold text-green-600">
                      {selectedAppeal.newScore}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">สถานะ</span>
                  {getStatusBadge(selectedAppeal.status)}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">วันที่ยื่น</span>
                  <span className="font-medium">
                    {formatDate(selectedAppeal.createdAt)}
                  </span>
                </div>
                {selectedAppeal.resolvedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      วันที่ดำเนินการ
                    </span>
                    <span className="font-medium">
                      {formatDate(selectedAppeal.resolvedAt)}
                    </span>
                  </div>
                )}
                {selectedAppeal.resolvedBy && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">ดำเนินการโดย</span>
                    <span className="font-medium">
                      {selectedAppeal.resolvedBy.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  เหตุผลในการอุทธรณ์
                </Label>
                <div className="rounded-lg border bg-background p-4 text-sm leading-relaxed">
                  {selectedAppeal.reason}
                </div>
              </div>

              {/* Existing response */}
              {selectedAppeal.status !== "PENDING" && selectedAppeal.response && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">หมายเหตุการดำเนินการ</Label>
                  <div className="rounded-lg border bg-background p-4 text-sm leading-relaxed">
                    {selectedAppeal.response}
                  </div>
                </div>
              )}

              {/* Response Note (for pending only) */}
              {selectedAppeal.status === "PENDING" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="new-score" className="text-sm font-semibold">
                      คะแนนใหม่ (ถ้าอนุมัติ)
                    </Label>
                    <Input
                      id="new-score"
                      type="number"
                      min={0}
                      value={newScore}
                      onChange={(e) => setNewScore(e.target.value)}
                      className="w-24"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="response-note"
                      className="text-sm font-semibold"
                    >
                      หมายเหตุการดำเนินการ
                    </Label>
                    <Textarea
                      id="response-note"
                      placeholder="ระบุเหตุผลประกอบการอนุมัติหรือปฏิเสธ..."
                      value={responseNote}
                      onChange={(e) => setResponseNote(e.target.value)}
                      className="min-h-20"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedAppeal?.status === "PENDING" ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isResolving}
                >
                  ยกเลิก
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleResolve("REJECTED")}
                  disabled={isResolving}
                  className="gap-1.5"
                >
                  {isResolving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  ปฏิเสธ
                </Button>
                <Button
                  onClick={() => handleResolve("APPROVED")}
                  disabled={isResolving}
                  className="gap-1.5"
                >
                  {isResolving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  อนุมัติ
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                ปิด
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
