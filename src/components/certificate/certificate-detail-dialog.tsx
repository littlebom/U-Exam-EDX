"use client";

import { useQuery } from "@tanstack/react-query";
import { Award, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>;
    case "EXPIRED":
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Expired</Badge>;
    case "REVOKED":
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">Revoked</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

interface CertificateDetail {
  id: string;
  certificateNumber: string;
  status: string;
  issuedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
  candidate: { name: string; email: string };
  template: { name: string };
  grade: {
    totalScore: number;
    maxScore: number;
    percentage: number;
    isPassed: boolean;
    session: {
      examSchedule: {
        exam: { title: string };
        startDate: string;
      };
    };
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificateId: string | null;
}

export function CertificateDetailDialog({ open, onOpenChange, certificateId }: Props) {
  const { data, isLoading } = useQuery<{ data: CertificateDetail }>({
    queryKey: ["certificate-detail", certificateId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/certificates/${certificateId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!certificateId && open,
  });

  const cert = data?.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            รายละเอียดใบรับรอง
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : cert ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm">{cert.certificateNumber}</span>
              {getStatusBadge(cert.status)}
            </div>

            <div className="grid gap-3 text-sm">
              <Row label="ผู้สอบ" value={cert.candidate.name} />
              <Row label="อีเมล" value={cert.candidate.email} />
              <Row label="วิชา" value={cert.grade.session.examSchedule.exam.title} />
              <Row label="วันสอบ" value={formatDate(cert.grade.session.examSchedule.startDate)} />
              <Row label="คะแนน" value={`${cert.grade.totalScore}/${cert.grade.maxScore} (${cert.grade.percentage.toFixed(1)}%)`} />
              <Row label="เทมเพลต" value={cert.template.name} />
              <Row label="วันออก" value={formatDate(cert.issuedAt)} />
              <Row label="วันหมดอายุ" value={formatDate(cert.expiresAt)} />
              {cert.revokedAt && (
                <>
                  <Row label="วันเพิกถอน" value={formatDate(cert.revokedAt)} />
                  <Row label="เหตุผล" value={cert.revokeReason ?? "—"} />
                </>
              )}
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">ไม่พบข้อมูล</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}
