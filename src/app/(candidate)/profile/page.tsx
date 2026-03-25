"use client";

import { useEffect, useRef } from "react";
import { CompetencyRadarChart } from "@/components/competency/competency-radar-chart";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  Mail,
  Phone,
  Pencil,
  FileText,
  CheckCircle2,
  BarChart3,
  Award,
  Loader2,
  GraduationCap,
  Calendar,
  User,
  MapPin,
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
import { ProfileAvatarUpload } from "@/components/profile/profile-avatar-upload";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────

interface EducationRecord {
  id: string;
  educationLevel: string;
  institution: string;
  faculty: string | null;
  major: string | null;
  graduationYear: number | null;
  sortOrder: number;
}

const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  secondary: "มัธยมศึกษา",
  vocational_cert: "ปวช.",
  high_vocational: "ปวส.",
  bachelor: "ปริญญาตรี",
  master: "ปริญญาโท",
  doctorate: "ปริญญาเอก",
};

const EDUCATION_LEVEL_ORDER: Record<string, number> = {
  secondary: 0,
  vocational_cert: 1,
  high_vocational: 2,
  bachelor: 3,
  master: 4,
  doctorate: 5,
};

/** Convert ค.ศ. (CE) year to พ.ศ. (BE) */
const toBuddhistYear = (ceYear: number) => ceYear + 543;

const GENDER_LABELS: Record<string, string> = {
  male: "ชาย",
  female: "หญิง",
  unspecified: "ไม่ระบุ",
};

/** Format ISO date string (YYYY-MM-DD) → Thai Buddhist Era display */
function formatDateBE(isoDate: string) {
  const d = new Date(isoDate);
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    imageUrl: string | null;
    createdAt: string;
  };
  profile: {
    displayName: string | null;
    institution: string | null;
    bio: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    nationalId: string | null;
    address: string | null;
    educations: EducationRecord[];
  } | null;
  stats: {
    totalExams: number;
    passedExams: number;
    passRate: number;
    avgScore: number;
  };
  recentResults: Array<{
    id: string;
    totalScore: number;
    maxScore: number;
    percentage: number | null;
    isPassed: boolean;
    gradedAt: string | null;
    session: {
      examSchedule: {
        exam: { id: string; title: string };
        startDate: string;
      };
    };
  }>;
  certificates?: Array<{
    id: string;
    certificateNumber: string;
    issuedAt: string;
    grade?: {
      session?: {
        examSchedule?: {
          exam?: { title?: string };
        };
      };
    };
  }>;
}

interface ScoreTrend {
  examTitle: string;
  date: string;
  score: number;
  isPassed: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.slice(0, 2);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(isPassed: boolean) {
  if (isPassed) {
    return (
      <Badge
        variant="secondary"
        className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      >
        ผ่าน
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    >
      ไม่ผ่าน
    </Badge>
  );
}

// ─── Component ───────────────────────────────────────────────────────

export default function ProfileDashboardPage() {
  const { data: sessionData, status: sessionStatus, update: updateSession } = useSession();
  const { data: profileData, isLoading } = useQuery<{ data: ProfileData }>({
    queryKey: ["profile-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/v1/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  const { data: trendData } = useQuery<{ data: ScoreTrend[] }>({
    queryKey: ["score-trend"],
    queryFn: async () => {
      const res = await fetch("/api/v1/profile/score-trend");
      if (!res.ok) throw new Error("Failed to fetch trend");
      return res.json();
    },
  });

  const profile = profileData?.data;
  const trend = trendData?.data ?? [];

  // Sync displayName + imageUrl → session so navbar stays in sync (once only)
  const resolvedName = profile?.profile?.displayName || profile?.user.name;
  const resolvedImage = profile?.user.imageUrl;
  const syncAttempted = useRef(false);

  useEffect(() => {
    if (syncAttempted.current) return;
    if (sessionStatus !== "authenticated" || !resolvedName) return;

    const needsNameSync = sessionData?.user?.name !== resolvedName;
    const needsImageSync =
      resolvedImage && sessionData?.user?.image !== resolvedImage;

    if (needsNameSync || needsImageSync) {
      syncAttempted.current = true;
      const updates: Record<string, string> = {};
      if (needsNameSync) updates.name = resolvedName;
      if (needsImageSync && resolvedImage) updates.image = resolvedImage;
      updateSession(updates).catch(() => {
        // Session update failed (e.g. expired) — ignore silently
      });
    }
  }, [resolvedName, resolvedImage, sessionData, sessionStatus, updateSession]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) return null;

  const displayName = profile.profile?.displayName || profile.user.name;

  const statsCards = [
    {
      title: "จำนวนสอบ",
      value: String(profile.stats.totalExams),
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "อัตราผ่าน",
      value: `${profile.stats.passRate}%`,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "คะแนนเฉลี่ย",
      value: String(profile.stats.avgScore),
      icon: BarChart3,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      title: "Certificate",
      value: String(profile.stats.passedExams),
      icon: Award,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  const progressData = trend.map((t, i) => ({
    exam: `ครั้งที่ ${i + 1}`,
    score: t.score,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">โปรไฟล์ของฉัน</h1>
        <p className="text-sm text-muted-foreground">
          ภาพรวมข้อมูลส่วนตัวและผลสอบ
        </p>
      </div>

      {/* Personal Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <ProfileAvatarUpload
                imageUrl={profile.user.imageUrl}
                displayName={displayName}
              />
            </div>

            {/* Name + Subtitle + Bio */}
            <div className="flex-1 min-w-0 space-y-1.5 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-xl font-semibold">{displayName}</h2>
                <Link href="/profile/edit" className="shrink-0 self-center sm:self-start">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Pencil className="h-4 w-4" />
                    แก้ไขข้อมูล
                  </Button>
                </Link>
              </div>
              {profile.profile?.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {profile.profile.bio}
                </p>
              )}

              {/* Basic Info — inline with name column */}
              <div className="grid gap-x-6 sm:grid-cols-2 text-sm pt-3 border-t mt-3">
                {/* Left column: วันเดือนปีเกิด, เพศ, ระดับการศึกษา */}
                <div className="space-y-2">
                  {profile.profile?.dateOfBirth && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground">{formatDateBE(profile.profile.dateOfBirth)}</span>
                    </div>
                  )}

                  {profile.profile?.gender && profile.profile.gender !== "unspecified" && (
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground">{GENDER_LABELS[profile.profile.gender] ?? profile.profile.gender}</span>
                    </div>
                  )}

                  {(() => {
                    const educations = profile.profile?.educations ?? [];
                    const highest = educations.length > 0
                      ? educations.reduce((prev, curr) =>
                          (EDUCATION_LEVEL_ORDER[curr.educationLevel] ?? 0) > (EDUCATION_LEVEL_ORDER[prev.educationLevel] ?? 0) ? curr : prev
                        )
                      : null;
                    const subtitle = highest
                      ? `${EDUCATION_LEVEL_LABELS[highest.educationLevel] ?? highest.educationLevel} — ${highest.institution}`
                      : profile.profile?.institution;
                    return subtitle ? (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate text-muted-foreground">{subtitle}</span>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Right column: อีเมล, เบอร์โทร, ที่อยู่ */}
                <div className="space-y-2 mt-2 sm:mt-0">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-muted-foreground">{profile.user.email}</span>
                  </div>

                  {profile.user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-muted-foreground">{profile.user.phone}</span>
                    </div>
                  )}

                  {profile.profile?.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground line-clamp-1">{profile.profile.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards — 4 columns */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                {card.title}
              </CardDescription>
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md",
                  card.bgColor
                )}
              >
                <card.icon className={cn("h-4 w-4", card.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Competency + Progress Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Spider Graph */}
        <div>
          <CompetencyRadarChart />
        </div>

        {/* Right: Certificates + Progress Chart */}
        <div className="space-y-6">
          {/* Recent Certificates */}
          {profile.certificates && profile.certificates.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-500" />
                    ใบรับรองล่าสุด
                  </CardTitle>
                  <Link href="/profile/certificates">
                    <Button variant="ghost" size="sm" className="text-xs">
                      ดูทั้งหมด →
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {profile.certificates.slice(0, 3).map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-center gap-3 rounded-lg border p-2.5"
                    >
                      {/* Badge SVG thumbnail */}
                      {cert.digitalBadge ? (
                        <img
                          src={`/api/v1/badges/${cert.id}/svg`}
                          alt="Badge"
                          className="h-10 w-10 rounded-full shrink-0"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 shrink-0">
                          <Award className="h-4 w-4 text-amber-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {cert.grade?.session?.examSchedule?.exam?.title ?? cert.certificateNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(cert.issuedAt).toLocaleDateString("th-TH", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      {cert.digitalBadge && (
                        <a
                          href={`/api/v1/badges/${cert.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline shrink-0"
                          title="Open Badge 3.0 JSON-LD"
                        >
                          OB 3.0
                        </a>
                      )}
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress Chart */}
          <Card>
          <CardHeader>
            <CardTitle className="text-base">พัฒนาการคะแนน</CardTitle>
            <CardDescription>
              แนวโน้มคะแนนสอบ {progressData.length} ครั้งล่าสุด
            </CardDescription>
          </CardHeader>
          <CardContent>
            {progressData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                ยังไม่มีข้อมูล
              </p>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={progressData}
                    margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="exam"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="คะแนน"
                      stroke="oklch(0.34 0.13 25)"
                      strokeWidth={2}
                      dot={{ fill: "oklch(0.34 0.13 25)", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Recent Results Table — full width */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ผลสอบล่าสุด</CardTitle>
          <CardDescription>ผลสอบ 5 ครั้งล่าสุดของคุณ</CardDescription>
        </CardHeader>
        <CardContent>
          {profile.recentResults.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              ยังไม่มีผลสอบ
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชุดสอบ</TableHead>
                  <TableHead className="text-center">คะแนน</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                  <TableHead className="text-right">วันสอบ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.recentResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {result.session.examSchedule.exam.title}
                    </TableCell>
                    <TableCell className="text-center">
                      {result.percentage ?? 0}%
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(result.isPassed)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatDate(result.session.examSchedule.startDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
