"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Camera,
  Users,
  ShieldCheck,
  ShieldAlert,
  Ban,
  Eye,
  Send,
  AlertTriangle,
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
import { cn } from "@/lib/utils";

type ProctoringItem = {
  id: string;
  status: string;
  candidateName: string;
  candidateEmail: string;
  examTitle: string;
  startedAt: string | null;
  eventCount: number;
  incidentCount: number;
  webcamEnabled: boolean;
};

function getStatusConfig(status: string) {
  switch (status) {
    case "MONITORING":
      return {
        label: "ปกติ",
        dotClass: "bg-green-500",
        badgeClass: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      };
    case "FLAGGED":
      return {
        label: "ตรวจพบ",
        dotClass: "bg-yellow-500",
        badgeClass: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      };
    case "REVIEWED":
      return {
        label: "ตรวจสอบแล้ว",
        dotClass: "bg-blue-500",
        badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      };
    default:
      return {
        label: status,
        dotClass: "bg-gray-500",
        badgeClass: "bg-gray-100 text-gray-800",
      };
  }
}

export default function ProctoringPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["proctoring-sessions"],
    queryFn: async () => {
      const res = await fetch("/api/v1/proctoring");
      const json = await res.json();
      return json;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const sessions: ProctoringItem[] = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const normalCount = sessions.filter((s) => s.status === "MONITORING").length;
  const flaggedCount = sessions.filter((s) => s.status === "FLAGGED").length;

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          คุมสอบออนไลน์ — Live Monitor
        </h1>
        <p className="text-sm text-muted-foreground">
          ติดตามผู้สอบแบบเรียลไทม์ ตรวจจับพฤติกรรมต้องสงสัย
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">
              กำลังสอบ
            </CardDescription>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">
              ปกติ
            </CardDescription>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/30">
              <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{normalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">
              ตรวจพบ
            </CardDescription>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{flaggedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">
              Incidents
            </CardDescription>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-100 dark:bg-red-900/30">
              <Ban className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {sessions.reduce((sum, s) => sum + s.incidentCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webcam Grid */}
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Camera className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              ไม่มีผู้สอบในขณะนี้
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => {
            const statusConfig = getStatusConfig(session.status);
            return (
              <Card key={session.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Webcam Placeholder */}
                  <div className="relative flex aspect-video items-center justify-center bg-gray-200 dark:bg-gray-800">
                    <Camera className="h-12 w-12 text-gray-400 dark:text-gray-600" />
                    {session.eventCount > 0 && (
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "gap-1",
                            session.status === "FLAGGED"
                              ? "bg-red-600 text-white dark:bg-red-700"
                              : "bg-yellow-500 text-white dark:bg-yellow-600"
                          )}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {session.eventCount}
                        </Badge>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1">
                      <span className={cn("h-2 w-2 rounded-full", statusConfig.dotClass)} />
                      <span className="text-xs font-medium text-white">
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{session.candidateName}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.examTitle}
                        </p>
                      </div>
                      <Badge variant="secondary" className={statusConfig.badgeClass}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Events: {session.eventCount} | Incidents: {session.incidentCount}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        ดูรายละเอียด
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 gap-1.5"
                      >
                        <Send className="h-3.5 w-3.5" />
                        บังคับส่ง
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
