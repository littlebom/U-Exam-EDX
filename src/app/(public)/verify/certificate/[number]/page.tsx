"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Award,
  Loader2,
  Calendar,
  User,
  BookOpen,
  Hash,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VerifyResult {
  valid: boolean;
  message?: string;
  certificateNumber?: string;
  candidateName?: string;
  examTitle?: string;
  examDate?: string;
  score?: number;
  status?: string;
  issuedAt?: string;
  expiresAt?: string | null;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function VerifyCertificatePage() {
  const params = useParams();
  const number = params.number as string;
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(
          `/api/v1/certificates/verify/${encodeURIComponent(number)}`
        );
        const json = await res.json();
        setResult(json.data ?? json);
      } catch {
        setResult({ valid: false, message: "เกิดข้อผิดพลาดในการตรวจสอบ" });
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [number]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">กำลังตรวจสอบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-12 px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ color: "#741717" }}
        >
          U-Exam
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ระบบตรวจสอบใบรับรอง
        </p>
      </div>

      {result?.valid ? (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-green-800 dark:text-green-400">
                  ใบรับรองถูกต้อง
                </h2>
                <p className="text-sm text-green-600 dark:text-green-500">
                  Certificate Verified
                </p>
              </div>
              <Badge className="ml-auto bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                {result.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={<User className="h-4 w-4" />}
              label="ผู้ได้รับ"
              value={result.candidateName ?? "—"}
            />
            <InfoRow
              icon={<BookOpen className="h-4 w-4" />}
              label="วิชาสอบ"
              value={result.examTitle ?? "—"}
            />
            <InfoRow
              icon={<Award className="h-4 w-4" />}
              label="คะแนน"
              value={result.score != null ? `${result.score.toFixed(1)}%` : "—"}
            />
            <InfoRow
              icon={<Hash className="h-4 w-4" />}
              label="หมายเลข"
              value={result.certificateNumber ?? "—"}
            />
            <InfoRow
              icon={<Calendar className="h-4 w-4" />}
              label="วันออก"
              value={formatDate(result.issuedAt)}
            />
            <InfoRow
              icon={<Calendar className="h-4 w-4" />}
              label="วันหมดอายุ"
              value={formatDate(result.expiresAt)}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-800 dark:text-red-400">
                  ใบรับรองไม่ถูกต้อง
                </h2>
                <p className="text-sm text-red-600 dark:text-red-500">
                  {result?.status === "EXPIRED"
                    ? "ใบรับรองหมดอายุแล้ว"
                    : result?.status === "REVOKED"
                      ? "ใบรับรองถูกเพิกถอนแล้ว"
                      : result?.message ?? "ไม่พบใบรับรองในระบบ"}
                </p>
              </div>
            </div>
          </CardHeader>
          {result?.certificateNumber && (
            <CardContent className="space-y-4">
              <InfoRow
                icon={<Hash className="h-4 w-4" />}
                label="หมายเลข"
                value={result.certificateNumber}
              />
              {result.candidateName && (
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="ผู้ได้รับ"
                  value={result.candidateName}
                />
              )}
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="สถานะ"
                value={
                  result.status === "EXPIRED"
                    ? "หมดอายุ"
                    : result.status === "REVOKED"
                      ? "ถูกเพิกถอน"
                      : "ไม่ถูกต้อง"
                }
              />
            </CardContent>
          )}
        </Card>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        ตรวจสอบโดย U-Exam — Enterprise-grade Examination Platform
      </p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground w-24">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
