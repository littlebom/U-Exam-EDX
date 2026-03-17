"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  Award,
  Loader2,
  CheckCircle2,
  Building2,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { SeatPicker } from "@/components/seat-picker";

// ─── Types ──────────────────────────────────────────────────────────

interface ScheduleDetail {
  id: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  registrationOpenDate: string | null;
  registrationDeadline: string | null;
  maxCandidates: number | null;
  status: string;
  location: string | null;
  exam: {
    id: string;
    title: string;
    description: string | null;
    mode: string;
    duration: number;
    passingScore: number | null;
  };
  tenant: { id: string; name: string };
  testCenter: {
    id: string;
    name: string;
    address: string;
    district: string;
    province: string;
  } | null;
  room: { id: string; name: string; capacity: number } | null;
  _count: { registrations: number };
  availableTestCenters: Array<{
    id: string;
    name: string;
    address: string;
    province: string;
  }>;
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getExamStatus(schedule: ScheduleDetail) {
  const max = schedule.maxCandidates ?? 999;
  const taken = schedule._count.registrations;
  const remaining = max - taken;
  if (remaining <= 0) return "full";
  if (remaining <= max * 0.15) return "closing_soon";
  return "open";
}

// ─── Page ───────────────────────────────────────────────────────────

export default function ExamDetailPage() {
  const params = useParams<{ scheduleId: string }>();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [selectedTestCenterId, setSelectedTestCenterId] = useState("");
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [selectedSeatNumber, setSelectedSeatNumber] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);

  const { data: schedule, isLoading } = useQuery<ScheduleDetail>({
    queryKey: ["catalog-detail", params.scheduleId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/catalog/${params.scheduleId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      return json.data;
    },
  });

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      const body: Record<string, string> = {};
      if (selectedTestCenterId) body.testCenterId = selectedTestCenterId;
      if (selectedSeatId) body.seatId = selectedSeatId;
      if (notes.trim()) body.notes = notes.trim();

      const res = await fetch(`/api/v1/catalog/${params.scheduleId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.success) {
        setRegistered(true);
        toast.success("สมัครสอบสำเร็จ!");
        setTimeout(() => router.push("/profile/registrations"), 2000);
      } else {
        toast.error(json.error?.message || "เกิดข้อผิดพลาดในการสมัครสอบ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold">ไม่พบรอบสอบ</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            รอบสอบนี้อาจปิดรับสมัครแล้วหรือไม่มีอยู่ในระบบ
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/catalog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับไปรายการสอบ
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const examStatus = getExamStatus(schedule);
  const remaining = (schedule.maxCandidates ?? 999) - schedule._count.registrations;
  const isLoggedIn = authStatus === "authenticated" && !!session?.user;
  const showTestCenterSelect = !schedule.testCenter && schedule.availableTestCenters.length > 0;
  const showSeatPicker = !!schedule.room;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back Link */}
      <Button variant="ghost" size="sm" className="mb-6 gap-1.5" asChild>
        <Link href="/catalog">
          <ArrowLeft className="h-4 w-4" />
          กลับไปรายการสอบ
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {schedule.exam.title}
          </h1>
          {examStatus === "open" && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 shrink-0">
              เปิดรับสมัคร
            </Badge>
          )}
          {examStatus === "closing_soon" && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
              ใกล้ปิดรับ
            </Badge>
          )}
          {examStatus === "full" && (
            <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 shrink-0">
              เต็มแล้ว
            </Badge>
          )}
        </div>
        <p className="mt-1 text-muted-foreground">{schedule.tenant.name}</p>
      </div>

      {/* Content Grid */}
      <div className="grid gap-8 lg:grid-cols-[1fr_35%]">
        {/* Left: Registration Card */}
        <div>
          <Card className="sticky top-20">
            {registered ? (
              /* Success State */
              <>
                <CardHeader className="text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
                  <CardTitle className="text-lg">สมัครสอบสำเร็จ!</CardTitle>
                  <CardDescription>
                    กำลังนำคุณไปหน้าประวัติสมัครสอบ...
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href="/profile/registrations">ดูประวัติสมัครสอบ</Link>
                  </Button>
                </CardFooter>
              </>
            ) : (
              /* Registration Form */
              <>
                <CardHeader>
                  <CardTitle className="text-lg">สมัครสอบ</CardTitle>
                  <CardDescription>
                    {schedule.exam.title}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Seats Remaining */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">ที่นั่งว่าง</span>
                    <span className="font-medium">
                      {Math.max(remaining, 0)}/{schedule.maxCandidates ?? "ไม่จำกัด"}
                    </span>
                  </div>

                  {/* Test Center Select */}
                  {showTestCenterSelect && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4" />
                        ศูนย์สอบ
                      </Label>
                      <Select value={selectedTestCenterId} onValueChange={setSelectedTestCenterId}>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกศูนย์สอบ (ไม่บังคับ)" />
                        </SelectTrigger>
                        <SelectContent>
                          {schedule.availableTestCenters.map((tc) => (
                            <SelectItem key={tc.id} value={tc.id}>
                              {tc.name} — {tc.province}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Seat Picker */}
                  {showSeatPicker && isLoggedIn && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        เลือกที่นั่ง
                      </Label>
                      <SeatPicker
                        scheduleId={params.scheduleId}
                        selectedSeatId={selectedSeatId}
                        onSeatSelect={(seatId, seatNumber) => {
                          setSelectedSeatId(seatId);
                          setSelectedSeatNumber(seatNumber);
                        }}
                      />
                      {selectedSeatNumber && (
                        <p className="text-sm font-medium text-primary">
                          ที่นั่ง: {selectedSeatNumber}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>หมายเหตุ</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="หมายเหตุเพิ่มเติม (ไม่บังคับ)"
                      maxLength={500}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  {isLoggedIn ? (
                    <Button
                      className="w-full gap-1.5"
                      size="lg"
                      disabled={isRegistering || examStatus === "full"}
                      onClick={handleRegister}
                    >
                      {isRegistering && <Loader2 className="h-4 w-4 animate-spin" />}
                      {examStatus === "full" ? "เต็มแล้ว" : "สมัครสอบ"}
                    </Button>
                  ) : (
                    <Button className="w-full gap-1.5" size="lg" asChild>
                      <Link href={`/login?callbackUrl=/catalog/${params.scheduleId}`}>
                        <LogIn className="h-4 w-4" />
                        เข้าสู่ระบบเพื่อสมัครสอบ
                      </Link>
                    </Button>
                  )}
                  {examStatus === "full" && (
                    <p className="text-xs text-center text-muted-foreground">
                      ที่นั่งเต็มแล้ว แต่คุณยังสามารถสมัครเข้า Waiting List ได้
                    </p>
                  )}
                </CardFooter>
              </>
            )}
          </Card>
        </div>

        {/* Right: Details */}
        <div className="space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">รายละเอียด</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {schedule.exam.description && (
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {schedule.exam.description}
                </p>
              )}
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-xs text-muted-foreground">ค่าสมัคร</p>
                <p className="text-2xl font-bold text-green-600">ฟรี</p>
              </div>
            </CardContent>
          </Card>

          {/* Exam Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ข้อมูลการสอบ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">วันสอบ</p>
                    <p className="text-sm font-medium">{formatDate(schedule.startDate)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(schedule.startDate)} - {formatTime(schedule.endDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">ระยะเวลาสอบ</p>
                    <p className="text-sm font-medium">{schedule.exam.duration} นาที</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Award className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">คะแนนผ่าน</p>
                    <p className="text-sm font-medium">
                      {schedule.exam.passingScore ?? "—"}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">ที่นั่งว่าง</p>
                    <p className="text-sm font-medium">
                      {Math.max(remaining, 0)}/{schedule.maxCandidates ?? "ไม่จำกัด"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location */}
              {(schedule.testCenter || schedule.location) && (
                <div className="mt-4 flex items-start gap-3 rounded-lg border p-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">สถานที่สอบ</p>
                    {schedule.testCenter ? (
                      <>
                        <p className="text-sm font-medium">{schedule.testCenter.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {schedule.testCenter.address}, {schedule.testCenter.district}, {schedule.testCenter.province}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-medium">{schedule.location}</p>
                    )}
                    {schedule.room && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ห้อง: {schedule.room.name} (จุ {schedule.room.capacity} ที่นั่ง)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Registration Deadline */}
              {schedule.registrationDeadline && (
                <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 p-3 text-sm">
                  <span className="text-amber-800 dark:text-amber-400">
                    ปิดรับสมัคร: {formatDate(schedule.registrationDeadline)} เวลา {formatTime(schedule.registrationDeadline)}
                  </span>
                </div>
              )}

              {/* Mode */}
              <div className="mt-4 flex gap-2">
                <Badge variant="outline">
                  {schedule.exam.mode === "PUBLIC" ? "สอบสาธารณะ" : "องค์กร"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
