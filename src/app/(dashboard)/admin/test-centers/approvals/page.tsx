"use client";

import { useState } from "react";
import {
  Plus,
  Loader2,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  FileCheck,
  FileX2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { useList, useSimpleList } from "@/hooks/use-api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────

interface ApprovalItem {
  id: string;
  type: string;
  status: string;
  comments: string | null;
  documents: Array<{ name: string; url: string; type: string }> | null;
  checklist: Array<{ item: string; passed: boolean; notes?: string }> | null;
  expiresAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  testCenter: { id: string; name: string; code: string | null; province: string };
  reviewedBy: { id: string; name: string } | null;
}

interface TestCenterOption {
  id: string;
  name: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "PENDING", label: "รอดำเนินการ" },
  { value: "IN_REVIEW", label: "กำลังตรวจสอบ" },
  { value: "APPROVED", label: "อนุมัติ" },
  { value: "REJECTED", label: "ปฏิเสธ" },
];

// ─── Helpers ────────────────────────────────────────────────────────

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 gap-1">
          <Clock className="h-3 w-3" /> รอดำเนินการ
        </Badge>
      );
    case "IN_REVIEW":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 gap-1">
          <Eye className="h-3 w-3" /> กำลังตรวจสอบ
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1">
          <CheckCircle2 className="h-3 w-3" /> อนุมัติ
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 gap-1">
          <XCircle className="h-3 w-3" /> ปฏิเสธ
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ─── Page ───────────────────────────────────────────────────────────

export default function CenterApprovalsPage() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<ApprovalItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submit form state
  const [submitTestCenterId, setSubmitTestCenterId] = useState("");
  const [submitType, setSubmitType] = useState<"INITIAL" | "RENEWAL">("INITIAL");

  // Review form state
  const [reviewAction, setReviewAction] = useState<"start_review" | "approve" | "reject">("approve");
  const [reviewComments, setReviewComments] = useState("");
  const [confirmReview, setConfirmReview] = useState(false);

  const queryClient = useQueryClient();

  const params: Record<string, string | number> = { page, perPage: 20 };
  if (filterStatus !== "all") params.status = filterStatus;

  const { data: result, isLoading } = useList<ApprovalItem>(
    "center-approvals",
    "/api/v1/center-approvals",
    params
  );
  const approvals = result?.data ?? [];
  const meta = result?.meta;

  const { data: testCenters } = useSimpleList<TestCenterOption>(
    "test-centers-list",
    "/api/v1/test-centers"
  );

  // Stats
  const pendingCount = approvals.filter((a) => a.status === "PENDING").length;
  const inReviewCount = approvals.filter((a) => a.status === "IN_REVIEW").length;
  const approvedCount = approvals.filter((a) => a.status === "APPROVED").length;
  const rejectedCount = approvals.filter((a) => a.status === "REJECTED").length;

  // Submit for approval
  const handleSubmit = async () => {
    if (!submitTestCenterId) {
      toast.error("กรุณาเลือกศูนย์สอบ");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/center-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testCenterId: submitTestCenterId, type: submitType }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("ส่งคำขออนุมัติสำเร็จ");
        setSubmitDialogOpen(false);
        setSubmitTestCenterId("");
        setSubmitType("INITIAL");
        queryClient.invalidateQueries({ queryKey: ["center-approvals"] });
      } else {
        toast.error(json.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Review actions
  const handleReview = async () => {
    if (!reviewTarget) return;
    if (reviewAction === "reject" && !reviewComments.trim()) {
      toast.error("กรุณาระบุเหตุผลในการปฏิเสธ");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/center-approvals/${reviewTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: reviewAction,
          comments: reviewComments || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const msgs: Record<string, string> = {
          start_review: "เริ่มตรวจสอบแล้ว",
          approve: "อนุมัติสำเร็จ",
          reject: "ปฏิเสธแล้ว",
        };
        toast.success(msgs[reviewAction]);
        setConfirmReview(false);
        setReviewTarget(null);
        setReviewComments("");
        queryClient.invalidateQueries({ queryKey: ["center-approvals"] });
        queryClient.invalidateQueries({ queryKey: ["center-analytics-overview"] });
      } else {
        toast.error(json.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReviewDialog = (item: ApprovalItem, action: "start_review" | "approve" | "reject") => {
    setReviewTarget(item);
    setReviewAction(action);
    setReviewComments("");
    if (action === "start_review") {
      // Direct confirm for start_review
      setConfirmReview(true);
    } else {
      setConfirmReview(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">อนุมัติศูนย์สอบ</h1>
          <p className="text-sm text-muted-foreground">
            ส่งคำขอและจัดการการอนุมัติศูนย์สอบ
          </p>
        </div>
        <Button onClick={() => setSubmitDialogOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          ส่งคำขออนุมัติ
        </Button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={filterStatus}
          onValueChange={(v) => {
            setFilterStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">รอดำเนินการ</span>
                <span className="text-2xl font-bold text-amber-600">{pendingCount}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">กำลังตรวจสอบ</span>
                <span className="text-2xl font-bold text-blue-600">{inReviewCount}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">อนุมัติ</span>
                <span className="text-2xl font-bold text-green-600">{approvedCount}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ปฏิเสธ</span>
                <span className="text-2xl font-bold text-red-600">{rejectedCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Approvals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการคำขออนุมัติ</CardTitle>
          <CardDescription>
            {meta ? `ทั้งหมด ${meta.total} รายการ` : "กำลังโหลด..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : approvals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileX2 className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">ยังไม่มีคำขออนุมัติ</p>
              <p className="text-sm">ส่งคำขออนุมัติใหม่โดยคลิกปุ่ม &quot;ส่งคำขออนุมัติ&quot;</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ศูนย์สอบ</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ผู้ตรวจสอบ</TableHead>
                  <TableHead>วันที่ส่ง</TableHead>
                  <TableHead>หมดอายุ</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{a.testCenter.name}</p>
                        <p className="text-xs text-muted-foreground">{a.testCenter.province}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {a.type === "INITIAL" ? "ครั้งแรก" : "ต่ออายุ"}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(a.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.reviewedBy?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.expiresAt
                        ? new Date(a.expiresAt).toLocaleDateString("th-TH", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {a.status === "PENDING" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => openReviewDialog(a, "start_review")}
                          >
                            <Eye className="h-3 w-3" /> เริ่มตรวจ
                          </Button>
                        )}
                        {(a.status === "PENDING" || a.status === "IN_REVIEW") && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-xs text-green-700 border-green-200 hover:bg-green-50"
                              onClick={() => openReviewDialog(a, "approve")}
                            >
                              <FileCheck className="h-3 w-3" /> อนุมัติ
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-xs text-red-700 border-red-200 hover:bg-red-50"
                              onClick={() => openReviewDialog(a, "reject")}
                            >
                              <XCircle className="h-3 w-3" /> ปฏิเสธ
                            </Button>
                          </>
                        )}
                        {a.status === "APPROVED" && a.comments && (
                          <span className="text-xs text-muted-foreground max-w-[150px] truncate" title={a.comments}>
                            {a.comments}
                          </span>
                        )}
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

      {/* Submit Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              ส่งคำขออนุมัติศูนย์สอบ
            </DialogTitle>
            <DialogDescription>
              เลือกศูนย์สอบและประเภทคำขอที่ต้องการส่ง
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>
                ศูนย์สอบ <span className="text-destructive">*</span>
              </Label>
              <Select value={submitTestCenterId} onValueChange={setSubmitTestCenterId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกศูนย์สอบ" />
                </SelectTrigger>
                <SelectContent>
                  {(testCenters ?? []).map((tc) => (
                    <SelectItem key={tc.id} value={tc.id}>
                      {tc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                ประเภท <span className="text-destructive">*</span>
              </Label>
              <Select value={submitType} onValueChange={(v) => setSubmitType(v as "INITIAL" | "RENEWAL")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INITIAL">ขอครั้งแรก</SelectItem>
                  <SelectItem value="RENEWAL">ต่ออายุ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-1.5">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              ส่งคำขอ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Confirmation */}
      <AlertDialog
        open={confirmReview}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmReview(false);
            setReviewTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reviewAction === "start_review"
                ? "เริ่มตรวจสอบ"
                : reviewAction === "approve"
                ? "อนุมัติศูนย์สอบ"
                : "ปฏิเสธคำขอ"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {reviewAction === "start_review"
                ? `ต้องการเริ่มตรวจสอบคำขอของ "${reviewTarget?.testCenter.name}" หรือไม่?`
                : reviewAction === "approve"
                ? `ต้องการอนุมัติศูนย์สอบ "${reviewTarget?.testCenter.name}" หรือไม่? ศูนย์สอบจะเปลี่ยนสถานะเป็น "ใช้งาน"`
                : `ต้องการปฏิเสธคำขอของ "${reviewTarget?.testCenter.name}" หรือไม่?`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {(reviewAction === "approve" || reviewAction === "reject") && (
            <div className="space-y-2 py-2">
              <Label>
                {reviewAction === "reject" ? (
                  <>เหตุผล <span className="text-destructive">*</span></>
                ) : (
                  "หมายเหตุ (ไม่บังคับ)"
                )}
              </Label>
              <Textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                rows={3}
                placeholder={
                  reviewAction === "reject"
                    ? "ระบุเหตุผลในการปฏิเสธ..."
                    : "หมายเหตุเพิ่มเติม..."
                }
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReview}
              disabled={isSubmitting}
              className={
                reviewAction === "reject"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : reviewAction === "approve"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : ""
              }
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {reviewAction === "start_review"
                ? "เริ่มตรวจสอบ"
                : reviewAction === "approve"
                ? "อนุมัติ"
                : "ปฏิเสธ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
