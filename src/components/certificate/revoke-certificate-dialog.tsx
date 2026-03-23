"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificateId: string | null;
  certificateNumber: string;
  onRevoked: () => void;
}

export function RevokeCertificateDialog({
  open,
  onOpenChange,
  certificateId,
  certificateNumber,
  onRevoked,
}: Props) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRevoke = async () => {
    if (!reason.trim() || !certificateId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/certificates/${certificateId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("เพิกถอนใบรับรองสำเร็จ");
        onOpenChange(false);
        setReason("");
        onRevoked();
      } else {
        toast.error(json.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setReason("");
        onOpenChange(v);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>เพิกถอนใบรับรอง</AlertDialogTitle>
          <AlertDialogDescription>
            ต้องการเพิกถอนใบรับรอง <strong>{certificateNumber}</strong> หรือไม่?
            การเพิกถอนไม่สามารถยกเลิกได้
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-2">
          <Label>
            เหตุผล <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="ระบุเหตุผลในการเพิกถอน..."
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleRevoke}
            disabled={isSubmitting || !reason.trim()}
            className="gap-1.5"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            เพิกถอน
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
