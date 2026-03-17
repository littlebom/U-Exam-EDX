"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Monitor,
  Clock,
  Calendar,
  MapPin,
  Play,
  RotateCcw,
  CheckCircle2,
  Timer,
  BookOpen,
  Loader2,
  Wifi,
  Building2,
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
import { toast } from "sonner";
import Link from "next/link";

interface MyExamItem {
  registrationId: string;
  scheduleId: string;
  examTitle: string;
  examMode: string;
  duration: number;
  totalPoints: number;
  passingScore: number;
  startDate: string;
  endDate: string;
  isOnline: boolean;
  testCenterName: string | null;
  examSessionStatus: string | null;
  examSessionId: string | null;
  canStartExam: boolean;
  isWithinTimeWindow: boolean;
}

interface MyExamsResponse {
  items: MyExamItem[];
  hasFaceImage: boolean;
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

function getStatusBadge(item: MyExamItem) {
  if (item.examSessionStatus === "SUBMITTED") {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        สอบแล้ว
      </Badge>
    );
  }
  if (item.examSessionStatus === "TIMED_OUT") {
    return (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
        <Timer className="mr-1 h-3 w-3" />
        หมดเวลา
      </Badge>
    );
  }
  if (item.examSessionStatus === "IN_PROGRESS") {
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
        <Play className="mr-1 h-3 w-3" />
        กำลังสอบ
      </Badge>
    );
  }
  if (item.isWithinTimeWindow && item.isOnline) {
    return (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
        <Clock className="mr-1 h-3 w-3" />
        เปิดให้สอบ
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <Clock className="mr-1 h-3 w-3" />
      รอเข้าสอบ
    </Badge>
  );
}

export default function MyExamsPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["my-exams"],
    queryFn: async () => {
      const res = await fetch("/api/v1/profile/my-exams");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as MyExamsResponse;
    },
  });

  const handleStartExam = (item: MyExamItem, hasFaceImage: boolean) => {
    // If already IN_PROGRESS → go straight to exam (skip face verify)
    if (item.examSessionStatus === "IN_PROGRESS") {
      router.push(`/take/${item.scheduleId}`);
      return;
    }

    // Check face image
    if (!hasFaceImage) {
      toast.error("กรุณาตั้งค่ารูปใบหน้าก่อนเข้าสอบ");
      router.push("/profile");
      return;
    }

    // Go to face verification
    router.push(`/verify/${item.scheduleId}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const items = data?.items ?? [];
  const hasFaceImage = data?.hasFaceImage ?? false;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Monitor className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">การสอบของฉัน</h1>
          <p className="text-sm text-muted-foreground">
            รายการสอบที่ลงทะเบียนแล้ว
          </p>
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">ยังไม่มีการสอบ</p>
              <p className="mt-1 text-sm text-muted-foreground">
                ลงทะเบียนสอบจากรายการสอบเพื่อเริ่มต้น
              </p>
            </div>
            <Link href="/catalog">
              <Button>ดูรายการสอบ</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card
              key={item.registrationId}
              className="transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {item.examTitle}
                    </CardTitle>
                    <CardDescription className="mt-1 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateTime(item.startDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {item.duration} นาที
                      </span>
                      <span className="flex items-center gap-1">
                        {item.isOnline ? (
                          <>
                            <Wifi className="h-3.5 w-3.5" />
                            สอบออนไลน์
                          </>
                        ) : (
                          <>
                            <Building2 className="h-3.5 w-3.5" />
                            {item.testCenterName}
                          </>
                        )}
                      </span>
                    </CardDescription>
                  </div>
                  {getStatusBadge(item)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>คะแนนเต็ม: {item.totalPoints}</span>
                    <span>คะแนนผ่าน: {item.passingScore ?? "-"}</span>
                  </div>

                  {/* Action button */}
                  {item.canStartExam &&
                    item.examSessionStatus !== "SUBMITTED" &&
                    item.examSessionStatus !== "TIMED_OUT" && (
                      <Button
                        onClick={() => handleStartExam(item, hasFaceImage)}
                        className="gap-2"
                      >
                        {item.examSessionStatus === "IN_PROGRESS" ? (
                          <>
                            <RotateCcw className="h-4 w-4" />
                            กลับเข้าสอบ
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            เข้าสอบ
                          </>
                        )}
                      </Button>
                    )}

                  {!item.isOnline &&
                    !item.examSessionStatus && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        ไปสอบที่ศูนย์สอบ
                      </div>
                    )}

                  {item.examSessionStatus === "SUBMITTED" && (
                    <Link href="/profile/results">
                      <Button variant="outline" size="sm">
                        ดูผลสอบ
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
