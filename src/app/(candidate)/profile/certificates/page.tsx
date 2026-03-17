"use client";

import { useQuery } from "@tanstack/react-query";
import { Award, Download, Share2, QrCode, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

type CertificateItem = {
  id: string;
  certificateNumber: string;
  examTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: string;
  issuedAt: string;
  expiresAt: string | null;
  verificationUrl: string | null;
  hasBadge: boolean;
};

export default function CandidateCertificatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["profile-certificates"],
    queryFn: async () => {
      const res = await fetch("/api/v1/profile/certificates");
      const json = await res.json();
      return json;
    },
  });

  const certificates: CertificateItem[] = data?.data ?? [];

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
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Award className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            ใบรับรองและ Badge
          </h1>
          <p className="text-sm text-muted-foreground">
            ใบรับรองทั้งหมด {certificates.length} ใบ
          </p>
        </div>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Award className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              ยังไม่มีใบรับรอง — สอบผ่านเกณฑ์เพื่อรับใบรับรอง
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <Card key={cert.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base leading-tight">
                      {cert.examTitle}
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {cert.certificateNumber}
                    </CardDescription>
                  </div>
                  {getStatusBadge(cert.status)}
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">วันออก</span>
                    <span className="font-medium">
                      {formatDate(cert.issuedAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">วันหมดอายุ</span>
                    <span className="font-medium">
                      {formatDate(cert.expiresAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">คะแนน</span>
                    <span className="font-medium">
                      {cert.score}/{cert.maxScore} ({Math.round(cert.percentage)}%)
                    </span>
                  </div>
                </div>

                {/* QR Code Placeholder */}
                <div className="flex items-center justify-center rounded-md border border-dashed p-4">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <QrCode className="h-12 w-12" />
                    <span className="text-xs">QR Verify</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="gap-2 border-t pt-4">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                  <Download className="h-4 w-4" />
                  ดาวน์โหลด PDF
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                  <Share2 className="h-4 w-4" />
                  แชร์
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
