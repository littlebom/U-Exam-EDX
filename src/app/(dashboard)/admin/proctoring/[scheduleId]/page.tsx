"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  AlertTriangle,
  Eye,
  Users,
  Loader2,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────

interface ProctoringSession {
  id: string;
  examSessionId: string;
  status: string;
  webcamEnabled: boolean;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateImage: string | null;
  startedAt: string | null;
  eventCount: number;
  incidentCount: number;
}

// ─── Helpers ────────────────────────────────────────────────────────

function getStatusBadge(status: string) {
  switch (status) {
    case "MONITORING":
      return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">ปกติ</Badge>;
    case "FLAGGED":
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">ตรวจพบ</Badge>;
    case "REVIEWED":
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">ตรวจสอบแล้ว</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เพิ่งเริ่ม";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  return `${Math.floor(mins / 60)} ชม. ${mins % 60} นาที`;
}

// ─── Page ───────────────────────────────────────────────────────────

export default function ScheduleProctoringPage() {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const queryClient = useQueryClient();

  const { data: result, isLoading } = useQuery<{
    data: ProctoringSession[];
    meta: { total: number };
  }>({
    queryKey: ["proctoring-schedule", scheduleId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/proctoring?scheduleId=${scheduleId}`);
      const json = await res.json();
      return { data: json.data ?? [], meta: json.meta ?? { total: 0 } };
    },
    refetchInterval: 10000,
  });

  const sessions = result?.data ?? [];
  const monitoring = sessions.filter((s) => s.status === "MONITORING").length;
  const flagged = sessions.filter((s) => s.status === "FLAGGED").length;

  // Get exam title from first session (all share the same schedule)
  const examTitle = sessions.length > 0 ? "รอบสอบ" : "ไม่พบข้อมูล";

  const handleForceSubmit = async (session: ProctoringSession) => {
    if (!confirm(`ต้องการบังคับส่งข้อสอบของ "${session.candidateName}" หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/v1/proctoring/${session.id}/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "POLICY_VIOLATION",
          description: "บังคับส่งข้อสอบโดยผู้คุมสอบ",
          action: "TERMINATE",
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("บังคับส่งข้อสอบสำเร็จ");
        queryClient.invalidateQueries({ queryKey: ["proctoring-schedule", scheduleId] });
      } else {
        toast.error(json.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/proctoring">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            คุมสอบ — {examTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            ติดตามผู้สอบแบบเรียลไทม์ ({sessions.length} คน)
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">กำลังสอบ</span>
              <Users className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="mt-1 text-2xl font-bold">{sessions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ปกติ</span>
              <Eye className="h-5 w-5 text-green-500/50" />
            </div>
            <p className="mt-1 text-2xl font-bold text-green-600">{monitoring}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ตรวจพบ</span>
              <AlertTriangle className="h-5 w-5 text-amber-500/50" />
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-600">{flagged}</p>
          </CardContent>
        </Card>
      </div>

      {/* Candidate Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Camera className="h-10 w-10 mb-3 opacity-50" />
            <p className="font-medium">ไม่มีผู้สอบในรอบนี้</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className={`relative ${
                session.status === "FLAGGED"
                  ? "border-amber-400 bg-amber-50/30 dark:bg-amber-900/10"
                  : ""
              }`}
            >
              {/* Event count badge */}
              <div className="absolute top-3 right-3">
                <Badge variant="outline" className="text-xs">
                  {session.status === "FLAGGED" ? (
                    <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                  ) : null}
                  {session.eventCount}
                </Badge>
              </div>

              {/* Webcam placeholder */}
              <div className="mx-4 mt-4 h-28 rounded-lg bg-muted flex items-center justify-center">
                <Camera className="h-8 w-8 text-muted-foreground/30" />
              </div>

              <CardContent className="pt-3 pb-4">
                {/* Candidate info */}
                <div className="mb-2">
                  <p className="font-medium text-sm truncate">{session.candidateName}</p>
                  <p className="text-xs text-muted-foreground truncate">{session.candidateEmail}</p>
                </div>

                {/* Status + time */}
                <div className="flex items-center justify-between mb-3">
                  {getStatusBadge(session.status)}
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(session.startedAt)}
                  </span>
                </div>

                {/* Stats */}
                <p className="text-xs text-muted-foreground mb-3">
                  Events: <strong>{session.eventCount}</strong>
                  {" | "}
                  Incidents: <strong>{session.incidentCount}</strong>
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/admin/proctoring/${scheduleId}/${session.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
                      <Eye className="h-3 w-3" />
                      ดูรายละเอียด
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleForceSubmit(session)}
                  >
                    <Ban className="h-3 w-3" />
                    บังคับส่ง
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
