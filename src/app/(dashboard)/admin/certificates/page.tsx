"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  MoreHorizontal,
  Eye,
  FileDown,
  Ban,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CertificateDetailDialog } from "@/components/certificate/certificate-detail-dialog";
import { RevokeCertificateDialog } from "@/components/certificate/revoke-certificate-dialog";
import { IssueCertificateDialog } from "@/components/certificate/issue-certificate-dialog";

type CertificateRow = {
  id: string;
  certificateNumber: string;
  candidateName: string;
  candidateEmail: string;
  examTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  templateName: string;
  status: string;
  issuedAt: string;
  expiresAt: string | null;
  hasBadge: boolean;
};

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        >
          Active
        </Badge>
      );
    case "EXPIRED":
      return (
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        >
          Expired
        </Badge>
      );
    case "REVOKED":
      return (
        <Badge
          variant="secondary"
          className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
        >
          Revoked
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

async function downloadPdf(certId: string, certNumber: string) {
  try {
    const res = await fetch(`/api/v1/certificates/${certId}/pdf`);
    if (!res.ok) {
      toast.error("ดาวน์โหลดไม่สำเร็จ");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${certNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    toast.error("เกิดข้อผิดพลาด");
  }
}

export default function DashboardCertificatesPage() {
  const [issueOpen, setIssueOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{
    id: string;
    number: string;
  } | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["certificates"],
    queryFn: async () => {
      const res = await fetch("/api/v1/certificates?perPage=100");
      const json = await res.json();
      return json;
    },
  });

  const certificates: CertificateRow[] = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const activeCount = certificates.filter((c) => c.status === "ACTIVE").length;
  const expiredCount = certificates.filter(
    (c) => c.status === "EXPIRED"
  ).length;
  const revokedCount = certificates.filter(
    (c) => c.status === "REVOKED"
  ).length;

  const stats = [
    { title: "ออกแล้ว", value: total, icon: Award, color: "text-primary" },
    {
      title: "Active",
      value: activeCount,
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      title: "หมดอายุ",
      value: expiredCount,
      icon: Clock,
      color: "text-red-600",
    },
    {
      title: "เพิกถอน",
      value: revokedCount,
      icon: XCircle,
      color: "text-gray-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            ใบรับรอง (Certificate)
          </h1>
          <p className="text-sm text-muted-foreground">
            จัดการใบรับรองและ Digital Badge ทั้งหมด
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setIssueOpen(true)}>
            <Award className="h-4 w-4" />
            ออกใบรับรอง
          </Button>
          <Link href="/admin/certificates/templates">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              สร้างเทมเพลต
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                {stat.title}
              </CardDescription>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", stat.color)}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Certificates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการใบรับรอง</CardTitle>
          <CardDescription>ใบรับรองทั้งหมด {total} ใบ</CardDescription>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Award className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                ยังไม่มีใบรับรอง
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่</TableHead>
                  <TableHead>ผู้ได้รับ</TableHead>
                  <TableHead>ชุดสอบ</TableHead>
                  <TableHead>วันออก</TableHead>
                  <TableHead>วันหมดอายุ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell className="font-mono text-xs">
                      {cert.certificateNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{cert.candidateName}</div>
                        <div className="text-xs text-muted-foreground">
                          {cert.candidateEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm">
                      {cert.examTitle}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(cert.issuedAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(cert.expiresAt)}
                    </TableCell>
                    <TableCell>{getStatusBadge(cert.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setDetailId(cert.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            ดูรายละเอียด
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              downloadPdf(cert.id, cert.certificateNumber)
                            }
                          >
                            <FileDown className="mr-2 h-4 w-4" />
                            ดาวน์โหลด PDF
                          </DropdownMenuItem>
                          {cert.status === "ACTIVE" && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() =>
                                setRevokeTarget({
                                  id: cert.id,
                                  number: cert.certificateNumber,
                                })
                              }
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              เพิกถอน
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <CertificateDetailDialog
        open={!!detailId}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        certificateId={detailId}
      />

      {/* Revoke Dialog */}
      <RevokeCertificateDialog
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        certificateId={revokeTarget?.id ?? null}
        certificateNumber={revokeTarget?.number ?? ""}
        onRevoked={() => {
          setRevokeTarget(null);
          queryClient.invalidateQueries({ queryKey: ["certificates"] });
        }}
      />

      {/* Issue Dialog */}
      <IssueCertificateDialog
        open={issueOpen}
        onOpenChange={setIssueOpen}
        onIssued={() =>
          queryClient.invalidateQueries({ queryKey: ["certificates"] })
        }
      />
    </div>
  );
}
