"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ScanFace,
  QrCode,
  Keyboard,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  Clock,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  UserCircle,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useDetail } from "@/hooks/use-api";
import { toast } from "sonner";

// ============================================================
// Types
// ============================================================

interface CandidateDescriptor {
  candidateId: string;
  registrationId: string;
  name: string;
  email: string;
  imageUrl: string | null;
  seatNumber: string | null;
  descriptor: number[];
}

interface RecentLog {
  id: string;
  type: string;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface CheckinStatus {
  schedule: {
    id: string;
    examTitle: string;
    startDate: string;
    maxCandidates: number | null;
  };
  staff: {
    id: string;
    name: string;
  };
  stats: {
    totalRegistered: number;
    checkedIn: number;
    lateCount: number;
    incidents: number;
    notCheckedIn: number;
  };
  recentCheckIns: RecentLog[];
  incidents: RecentLog[];
}

interface CheckinResult {
  status: string;
  message: string;
  candidate: { id: string; name: string; email: string };
  seatNumber: string | null;
  examTitle?: string;
  method?: string;
}

// ============================================================
// Helpers
// ============================================================

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อกี้";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hours = Math.floor(mins / 60);
  return `${hours} ชม.ที่แล้ว`;
}

// ============================================================
// Component
// ============================================================

export default function MobileCheckinPage() {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("face");
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [faceReady, setFaceReady] = useState(false);
  const [descriptors, setDescriptors] = useState<CandidateDescriptor[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceMatcherRef = useRef<unknown>(null);

  // Fetch check-in status (refresh every 10s)
  const { data: status, refetch: refetchStatus } = useDetail<CheckinStatus>(
    `checkin-status-${scheduleId}`,
    `/api/v1/checkin/status/${scheduleId}`,
    !!scheduleId
  );

  // ── Load face-api.js models + descriptors ──
  useEffect(() => {
    if (activeTab !== "face") return;
    let cancelled = false;

    const init = async () => {
      try {
        // Load face-api models
        const faceapi = await import("face-api.js");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);

        if (cancelled) return;

        // Fetch descriptors
        const res = await fetch(`/api/v1/checkin/${scheduleId}/descriptors`);
        const json = await res.json();
        if (!json.success) return;

        const candidates = json.data as CandidateDescriptor[];
        setDescriptors(candidates);

        // Build FaceMatcher
        if (candidates.length > 0) {
          const labeledDescriptors = candidates.map(
            (c) =>
              new faceapi.LabeledFaceDescriptors(c.candidateId, [
                new Float32Array(c.descriptor),
              ])
          );
          faceMatcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
        }

        setFaceReady(true);

        // Start camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: 640, height: 480 },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.error("Face init failed:", err);
        toast.error("ไม่สามารถเริ่มระบบสแกนใบหน้าได้");
      }
    };

    init();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [activeTab, scheduleId]);

  // ── Face Scan ──
  const handleFaceScan = useCallback(async () => {
    if (!videoRef.current || !faceMatcherRef.current || scanning) return;
    setScanning(true);
    setResult(null);

    try {
      const faceapi = await import("face-api.js");
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      if (!detection) {
        toast.warning("ไม่พบใบหน้า กรุณาลองใหม่");
        setScanning(false);
        return;
      }

      const matcher = faceMatcherRef.current as InstanceType<typeof faceapi.FaceMatcher>;
      const match = matcher.findBestMatch(detection.descriptor);

      if (match.label === "unknown") {
        setResult({
          status: "NOT_FOUND",
          message: "ไม่พบข้อมูลใบหน้าในระบบ",
          candidate: { id: "", name: "ไม่ทราบ", email: "" },
          seatNumber: null,
        });
        setScanning(false);
        return;
      }

      // Found match — get candidate info
      const matched = descriptors.find((d) => d.candidateId === match.label);
      if (!matched) {
        setScanning(false);
        return;
      }

      const confidence = 1 - match.distance; // Convert distance to confidence

      setResult({
        status: "MATCHED",
        message: `พบใบหน้าตรงกับ ${matched.name} (${(confidence * 100).toFixed(0)}%)`,
        candidate: { id: matched.candidateId, name: matched.name, email: matched.email },
        seatNumber: matched.seatNumber,
        method: "FACE",
      });
    } catch {
      toast.error("เกิดข้อผิดพลาดในการสแกน");
    } finally {
      setScanning(false);
    }
  }, [scanning, descriptors]);

  // ── Confirm Check-in (Face) ──
  const handleConfirmFace = async () => {
    if (!result || result.status !== "MATCHED") return;
    setScanning(true);
    try {
      const res = await fetch("/api/v1/checkin/face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examScheduleId: scheduleId,
          candidateId: result.candidate.id,
          confidence: 0.8,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
        toast.success(json.data.message);
        refetchStatus();
      } else {
        toast.error(json.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setScanning(false);
    }
  };

  // ── Manual Voucher Check-in ──
  const handleManualCheckin = async () => {
    if (!voucherCode.trim()) {
      toast.error("กรุณากรอกรหัส Voucher");
      return;
    }
    setScanning(true);
    setResult(null);
    try {
      const res = await fetch("/api/v1/checkin/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucherCode: voucherCode.trim(), examScheduleId: scheduleId }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
        toast.success(json.data.message);
        setVoucherCode("");
        refetchStatus();
      } else {
        toast.error(json.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setScanning(false);
    }
  };

  // ── Status Badge ──
  const resultIcon = () => {
    if (!result) return null;
    if (result.status === "SUCCESS" || result.status === "LATE" || result.status === "ALREADY_CHECKED_IN") {
      return <CheckCircle2 className="h-8 w-8 text-green-600" />;
    }
    if (result.status === "MATCHED") {
      return <ScanFace className="h-8 w-8 text-blue-600" />;
    }
    return <XCircle className="h-8 w-8 text-red-500" />;
  };

  const recentLogs = status?.recentCheckIns ?? [];

  return (
    <div className="max-w-lg mx-auto space-y-3 pb-8">
      {/* ── Info Header ── */}
      <div className="rounded-lg border bg-card p-3 space-y-2">
        {/* Top row: Back + Title */}
        <div className="flex items-start gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 -ml-1"
            onClick={() => router.push("/admin/exams/schedule")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-sm leading-tight truncate">
              {status?.schedule?.examTitle ?? "กำลังโหลด..."}
            </h1>
            {status?.schedule?.startDate && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <CalendarDays className="h-3 w-3" />
                {formatDateTime(status.schedule.startDate)}
              </p>
            )}
          </div>
          <Badge variant="outline" className="text-xs shrink-0">
            Check-in
          </Badge>
        </div>

        <Separator />

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span className="text-lg font-bold text-primary">{status?.stats?.checkedIn ?? 0}</span>
              <span className="text-muted-foreground">/ {status?.stats?.totalRegistered ?? 0}</span>
            </span>
            {(status?.stats?.lateCount ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <Clock className="h-3 w-3" /> สาย {status?.stats?.lateCount}
              </span>
            )}
            {(status?.stats?.incidents ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <AlertTriangle className="h-3 w-3" /> {status?.stats?.incidents}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-muted-foreground">
            <UserCircle className="h-3 w-3" />
            {status?.staff?.name ?? "—"}
          </span>
        </div>

        {/* Progress bar */}
        {(status?.stats?.totalRegistered ?? 0) > 0 && (
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{
                width: `${Math.min(100, ((status?.stats?.checkedIn ?? 0) / (status?.stats?.totalRegistered ?? 1)) * 100)}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="face" className="flex items-center gap-1">
            <ScanFace className="h-4 w-4" /> ใบหน้า
          </TabsTrigger>
          <TabsTrigger value="qr" className="flex items-center gap-1">
            <QrCode className="h-4 w-4" /> QR
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-1">
            <Keyboard className="h-4 w-4" /> รหัส
          </TabsTrigger>
        </TabsList>

        {/* ── Face Scan Tab ── */}
        <TabsContent value="face" className="space-y-3">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            {!faceReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <p className="text-sm">กำลังโหลดระบบ Face AI...</p>
                <p className="text-xs text-white/60 mt-1">
                  {descriptors.length > 0
                    ? `โหลดข้อมูล ${descriptors.length} คนแล้ว`
                    : "กำลังโหลดข้อมูลผู้สอบ..."}
                </p>
              </div>
            )}
          </div>
          <Button
            onClick={handleFaceScan}
            disabled={!faceReady || scanning}
            className="w-full"
            size="lg"
          >
            {scanning ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ScanFace className="h-5 w-5 mr-2" /> สแกนใบหน้า
              </>
            )}
          </Button>
        </TabsContent>

        {/* ── QR Scan Tab ── */}
        <TabsContent value="qr" className="space-y-3">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <QrCode className="h-16 w-16 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                ฟีเจอร์ QR Scanner จะพร้อมใช้งานเร็วๆ นี้
              </p>
              <p className="text-xs text-muted-foreground">
                ระหว่างนี้สามารถใช้แท็บ &quot;รหัส&quot; กรอกรหัส Voucher แทนได้
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Manual Tab ── */}
        <TabsContent value="manual" className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="VCH-2026-0001"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleManualCheckin()}
              className="font-mono text-lg"
            />
            <Button onClick={handleManualCheckin} disabled={scanning}>
              {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : "ตรวจสอบ"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Result Card ── */}
      {result && (
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              {resultIcon()}
              <div className="flex-1 space-y-1">
                <p className="font-semibold">{result.candidate.name}</p>
                <p className="text-sm text-muted-foreground">{result.candidate.email}</p>
                <p className="text-sm">{result.message}</p>
                {result.seatNumber && (
                  <p className="text-lg font-bold text-primary">
                    ที่นั่ง: {result.seatNumber}
                  </p>
                )}
                {result.examTitle && (
                  <p className="text-xs text-muted-foreground">{result.examTitle}</p>
                )}
              </div>
            </div>

            {/* Confirm button for face match */}
            {result.status === "MATCHED" && (
              <Button
                className="w-full mt-4"
                size="lg"
                onClick={handleConfirmFace}
                disabled={scanning}
              >
                {scanning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-2" /> ยืนยันเช็คอิน
                  </>
                )}
              </Button>
            )}

            {/* Reset for next scan */}
            {(result.status === "SUCCESS" || result.status === "LATE" || result.status === "ALREADY_CHECKED_IN") && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setResult(null)}
              >
                สแกนคนถัดไป
              </Button>
            )}

            {result.status === "NOT_FOUND" && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setResult(null)}
              >
                ลองใหม่
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Recent Check-in Logs ── */}
      {recentLogs.length > 0 && (
        <div className="rounded-lg border bg-card">
          <button
            onClick={() => setShowLogs((v) => !v)}
            className="w-full flex items-center justify-between p-3 text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              เช็คอินล่าสุด ({recentLogs.length})
            </span>
            {showLogs ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {showLogs && (
            <div className="border-t divide-y">
              {recentLogs.map((log) => {
                const meta = log.metadata;
                const isLate = log.type === "LATE_CHECKIN";
                return (
                  <div key={log.id} className="flex items-center gap-3 px-3 py-2">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${isLate ? "text-amber-500" : "text-green-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {(meta?.candidateName as string) ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {meta?.seatNumber ? `ที่นั่ง ${meta.seatNumber}` : ""}
                        {meta?.method ? ` • ${meta.method === "FACE" ? "Face Scan" : "Voucher"}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{formatTime(log.createdAt)}</p>
                      {isLate && (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 px-1">
                          สาย
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
