"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  UserCheck,
  FileX2,
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useList, useSimpleList } from "@/hooks/use-api";
import {
  createGraderAssignmentAction,
  updateGraderAssignmentAction,
  deleteGraderAssignmentAction,
} from "@/actions/grader-assignment.actions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ============================================================
// Types
// ============================================================

interface AssignmentRow {
  id: string;
  scope: string;
  isActive: boolean;
  createdAt: string;
  exam: { id: string; title: string };
  user: { id: string; name: string | null; email: string };
  section: { id: string; title: string } | null;
}

interface ExamOption {
  id: string;
  title: string;
}

interface UserOption {
  id: string;
  name: string | null;
  email: string;
}

// ============================================================
// Component
// ============================================================

export default function GraderAssignmentPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AssignmentRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form state
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const queryClient = useQueryClient();

  // Fetch assignments
  const { data: assignmentData, isLoading } = useList<AssignmentRow>(
    "grader-assignments",
    "/api/v1/grader-assignments",
    { perPage: 100 }
  );
  const assignments = assignmentData?.data ?? [];

  // Fetch exams and users for selects
  const { data: exams } = useSimpleList<ExamOption>("exams", "/api/v1/exams");
  const { data: users } = useSimpleList<UserOption>("users-list", "/api/v1/users");

  // Create assignment
  const handleCreate = async () => {
    if (!selectedExamId || !selectedUserId) {
      toast.error("กรุณาเลือกชุดสอบและผู้ตรวจ");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createGraderAssignmentAction({
        examId: selectedExamId,
        userId: selectedUserId,
      });
      if (result.success) {
        toast.success("มอบหมายผู้ตรวจสำเร็จ");
        setDialogOpen(false);
        setSelectedExamId("");
        setSelectedUserId("");
        queryClient.invalidateQueries({ queryKey: ["grader-assignments"] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active
  const handleToggleActive = async (assignment: AssignmentRow) => {
    setTogglingId(assignment.id);
    try {
      const result = await updateGraderAssignmentAction(assignment.id, {
        isActive: !assignment.isActive,
      });
      if (result.success) {
        toast.success(
          assignment.isActive ? "ปิดการมอบหมายแล้ว" : "เปิดการมอบหมายแล้ว"
        );
        queryClient.invalidateQueries({ queryKey: ["grader-assignments"] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setTogglingId(null);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deleteGraderAssignmentAction(deleteTarget.id);
      if (result.success) {
        toast.success("ลบการมอบหมายสำเร็จ");
        setDeleteTarget(null);
        queryClient.invalidateQueries({ queryKey: ["grader-assignments"] });
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">มอบหมายผู้ตรวจ</h1>
          <p className="text-sm text-muted-foreground">
            กำหนดผู้ตรวจข้อสอบอัตนัยสำหรับแต่ละชุดสอบ
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          มอบหมายผู้ตรวจ
        </Button>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            รายการมอบหมาย ({assignments.length})
          </CardTitle>
          <CardDescription>
            ผู้ตรวจที่ได้รับมอบหมายสำหรับแต่ละชุดสอบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileX2 className="h-10 w-10 mb-2" />
              <p className="text-sm">ยังไม่มีการมอบหมายผู้ตรวจ</p>
              <p className="text-xs mt-1">
                กดปุ่ม &quot;มอบหมายผู้ตรวจ&quot; เพื่อเริ่มต้น
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ผู้ตรวจ</TableHead>
                  <TableHead>ชุดสอบ</TableHead>
                  <TableHead className="text-center">ขอบเขต</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <UserCheck className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {a.user.name || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {a.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{a.exam.title}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {a.scope === "ALL" ? "ทั้งหมด" : a.section?.title || "เฉพาะส่วน"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={a.isActive}
                        onCheckedChange={() => handleToggleActive(a)}
                        disabled={togglingId === a.id}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(a)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>มอบหมายผู้ตรวจ</DialogTitle>
            <DialogDescription>
              เลือกชุดสอบและผู้ตรวจที่ต้องการมอบหมาย
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                ชุดสอบ <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกชุดสอบ" />
                </SelectTrigger>
                <SelectContent>
                  {(exams ?? []).map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                ผู้ตรวจ <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกผู้ตรวจ" />
                </SelectTrigger>
                <SelectContent>
                  {(users ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              มอบหมาย
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบการมอบหมาย</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบการมอบหมาย {deleteTarget?.user.name || deleteTarget?.user.email} จาก &quot;{deleteTarget?.exam.title}&quot; หรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
