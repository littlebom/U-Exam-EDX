"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  AlertTriangle,
  Clock,
  User,
  Send,
  Ban,
  Eye,
  CheckCircle2,
  MessageSquareWarning,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useDetail, useSimpleList } from "@/hooks/use-api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  PROCTORING_EVENT_LABELS,
  SEVERITY_LABELS,
  INCIDENT_TYPE_LABELS,
  INCIDENT_ACTION_LABELS,
} from "@/lib/validations/proctoring";

// ============================================================
// Types
// ============================================================

interface SessionDetail {
  id: string;
  status: string;
  webcamEnabled: boolean;
  screenShareEnabled: boolean;
  createdAt: string;
  examSession: {
    id: string;
    status: string;
    startedAt: string | null;
    submittedAt: string | null;
    candidate: { name: string; email: string };
    examSchedule: { exam: { title: string } };
  };
}

interface ProctoringEventItem {
  id: string;
  type: string;
  severity: string;
  screenshot: string | null;
  metadata: Record<string, unknown> | null;
  timestamp: string;
}

// ============================================================
// Component
// ============================================================

export default function ProctoringSessionDetailPage() {
  const { scheduleId, sessionId: id } = useParams<{ scheduleId: string; sessionId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [incidentOpen, setIncidentOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [incidentType, setIncidentType] = useState("SUSPICIOUS_BEHAVIOR");
  const [incidentAction, setIncidentAction] = useState("WARNING");
  const [incidentDesc, setIncidentDesc] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch session detail
  const { data: session, isLoading } = useDetail<SessionDetail>(
    `proctoring-session-${id}`,
    `/api/v1/proctoring?sessionId=${id}`,
    !!id
  );

  // Fetch events
  const { data: events } = useSimpleList<ProctoringEventItem>(
    `proctoring-events-${id}`,
    `/api/v1/proctoring/${id}/events?perPage=100`
  );

  // Screenshots only
  const screenshots = (events ?? []).filter((e) => e.screenshot);

  // Non-screenshot events for timeline
  const timelineEvents = events ?? [];

  const handleCreateIncident = async () => {
    if (!incidentDesc.trim()) {
      toast.error("กรุณาระบุรายละเอียด");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/proctoring/${id}/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: incidentType,
          description: incidentDesc,
          action: incidentAction,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          incidentAction === "TERMINATE"
            ? "ยุติการสอบสำเร็จ"
            : "สร้างเหตุการณ์สำเร็จ"
        );
        setIncidentOpen(false);
        setIncidentDesc("");
        queryClient.invalidateQueries({ queryKey: [`proctoring-session-${id}`] });
      } else {
        toast.error(json.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      toast.error("กรุณาพิมพ์ข้อความ");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/proctoring/${id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("ส่งข้อความสำเร็จ");
        setMessageOpen(false);
        setMessageText("");
      } else {
        toast.error(json.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForceSubmit = () => {
    setIncidentType("POLICY_VIOLATION");
    setIncidentAction("TERMINATE");
    setIncidentDesc("ผู้คุมสอบบังคับส่งข้อสอบ");
    setIncidentOpen(true);
  };

  const handleMarkReviewed = async () => {
    try {
      // Use the proctoring status update directly
      const res = await fetch(`/api/v1/proctoring/${id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "REVIEWED_BY_PROCTOR", severity: "LOW" }),
      });
      if (res.ok) {
        toast.success("ตรวจสอบเสร็จสิ้น");
        queryClient.invalidateQueries({ queryKey: [`proctoring-session-${id}`] });
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary" }> = {
      MONITORING: { label: "กำลังคุมสอบ", variant: "default" },
      FLAGGED: { label: "ตรวจพบปัญหา", variant: "destructive" },
      REVIEWED: { label: "ตรวจสอบแล้ว", variant: "secondary" },
    };
    const s = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const severityColor = (severity: string) => {
    if (severity === "HIGH") return "text-red-600 bg-red-50";
    if (severity === "MEDIUM") return "text-amber-600 bg-amber-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/proctoring/${scheduleId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">รายละเอียดการคุมสอบ</h1>
            <p className="text-sm text-muted-foreground">
              {session?.examSession?.examSchedule?.exam?.title ?? "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMessageOpen(true)}
          >
            <MessageSquareWarning className="h-4 w-4 mr-1" />
            ส่งคำเตือน
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkReviewed}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            ตรวจสอบแล้ว
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleForceSubmit}
          >
            <Ban className="h-4 w-4 mr-1" />
            บังคับส่ง
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> ผู้สอบ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{session?.examSession?.candidate?.name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">
              {session?.examSession?.candidate?.email ?? "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> สถานะ
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {statusBadge(session?.status ?? "MONITORING")}
            {session?.webcamEnabled && (
              <Badge variant="outline" className="text-xs">
                <Camera className="h-3 w-3 mr-1" /> Webcam
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> เวลา
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              เริ่ม: {session?.examSession?.startedAt
                ? new Date(session.examSession.startedAt).toLocaleString("th-TH")
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              Events: {timelineEvents.length} รายการ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Screenshots Gallery */}
      {screenshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-4 w-4" /> Screenshots ({screenshots.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {screenshots.map((s) => (
                <div key={s.id} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.screenshot!}
                    alt={s.type}
                    className="rounded-md border w-full h-auto aspect-video object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 rounded-b-md">
                    {new Date(s.timestamp).toLocaleTimeString("th-TH")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Event Timeline ({timelineEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timelineEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              ยังไม่มี events
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {timelineEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center gap-3 rounded-md border p-2 text-sm"
                >
                  <Badge
                    variant="outline"
                    className={cn("text-xs shrink-0", severityColor(ev.severity))}
                  >
                    {SEVERITY_LABELS[ev.severity] || ev.severity}
                  </Badge>
                  <span className="font-medium shrink-0">
                    {PROCTORING_EVENT_LABELS[ev.type] || ev.type}
                  </span>
                  <span className="text-muted-foreground text-xs ml-auto shrink-0">
                    {new Date(ev.timestamp).toLocaleTimeString("th-TH")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Incident Dialog ── */}
      <Dialog open={incidentOpen} onOpenChange={setIncidentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างเหตุการณ์</DialogTitle>
            <DialogDescription>
              บันทึกเหตุการณ์สำหรับ session นี้
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ประเภท</Label>
              <Select value={incidentType} onValueChange={setIncidentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INCIDENT_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>การดำเนินการ</Label>
              <Select value={incidentAction} onValueChange={setIncidentAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INCIDENT_ACTION_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {incidentAction === "TERMINATE" && (
                <p className="text-xs text-destructive">
                  ⚠️ การดำเนินการนี้จะยุติการสอบทันที
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>รายละเอียด</Label>
              <Textarea
                value={incidentDesc}
                onChange={(e) => setIncidentDesc(e.target.value)}
                placeholder="อธิบายเหตุการณ์..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIncidentOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              variant={incidentAction === "TERMINATE" ? "destructive" : "default"}
              onClick={handleCreateIncident}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : incidentAction === "TERMINATE" ? (
                "ยุติการสอบ"
              ) : (
                "บันทึก"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Send Warning Dialog ── */}
      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ส่งคำเตือน</DialogTitle>
            <DialogDescription>
              ข้อความจะแสดงบนหน้าจอนักศึกษาทันที
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>ข้อความ</Label>
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="เช่น กรุณาอยู่หน้าจอ, ตรวจพบพฤติกรรมผิดปกติ..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {messageText.length}/500
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSendMessage} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" /> ส่ง
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
