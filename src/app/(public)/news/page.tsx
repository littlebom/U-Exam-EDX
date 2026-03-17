"use client";

import { Calendar, Megaphone, Sparkles, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ─── Mock Data (สำหรับ MVP) ────────────────────────────────────────

const newsItems = [
  {
    id: "1",
    title: "เปิดรับสมัครสอบวัดระดับความรู้ IT Fundamentals ประจำปี 2569",
    excerpt:
      "U-Exam เปิดรับสมัครสอบวัดระดับความรู้พื้นฐานด้านเทคโนโลยีสารสนเทศ สำหรับนักศึกษาและบุคคลทั่วไป สมัครได้ตั้งแต่วันนี้ถึง 30 เมษายน 2569",
    date: "2026-03-10",
    category: "ประกาศ",
    icon: Megaphone,
  },
  {
    id: "2",
    title: "อัปเดตระบบใหม่: รองรับการสอบออนไลน์แบบ Proctoring",
    excerpt:
      "U-Exam ได้เพิ่มฟีเจอร์ Proctoring ที่ช่วยให้ผู้จัดสอบสามารถคุมสอบออนไลน์ได้อย่างมีประสิทธิภาพ ด้วยระบบตรวจจับใบหน้าและบันทึกหน้าจอ",
    date: "2026-03-05",
    category: "อัปเดต",
    icon: Sparkles,
  },
  {
    id: "3",
    title: "ร่วมมือกับมหาวิทยาลัยชั้นนำ 10 แห่ง ในการจัดสอบ Certification",
    excerpt:
      "U-Exam ได้ลงนามความร่วมมือกับมหาวิทยาลัยชั้นนำ 10 แห่ง ในการใช้ระบบ U-Exam จัดสอบ Certification ให้กับนักศึกษาและบุคคลทั่วไป",
    date: "2026-02-28",
    category: "ข่าว",
    icon: Info,
  },
  {
    id: "4",
    title: "เปิดให้บริการศูนย์สอบแห่งใหม่ จังหวัดเชียงใหม่",
    excerpt:
      "ศูนย์สอบ U-Exam สาขาเชียงใหม่ พร้อมให้บริการแล้ว รองรับผู้สอบได้ 200 คนต่อรอบ พร้อมอุปกรณ์และระบบเครือข่ายมาตรฐานสากล",
    date: "2026-02-20",
    category: "ประกาศ",
    icon: Megaphone,
  },
  {
    id: "5",
    title: "แนะนำฟีเจอร์ Digital Badge: แสดงผลสอบบนโซเชียลมีเดีย",
    excerpt:
      "ผู้สอบผ่านสามารถรับ Digital Badge และแชร์ผลสอบบน LinkedIn, Facebook ได้ทันที พร้อมระบบ Verify ออนไลน์",
    date: "2026-02-15",
    category: "อัปเดต",
    icon: Sparkles,
  },
  {
    id: "6",
    title: "ปรับปรุงระบบรายงานผลสอบ: เพิ่ม Item Analysis",
    excerpt:
      "อัปเดตระบบวิเคราะห์ข้อสอบรายข้อ (Item Analysis) ช่วยให้ผู้จัดสอบเข้าใจคุณภาพข้อสอบและปรับปรุงให้ดียิ่งขึ้น",
    date: "2026-02-10",
    category: "อัปเดต",
    icon: Sparkles,
  },
];

function getCategoryBadge(category: string) {
  switch (category) {
    case "ประกาศ":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
        >
          ประกาศ
        </Badge>
      );
    case "อัปเดต":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        >
          อัปเดต
        </Badge>
      );
    case "ข่าว":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
        >
          ข่าว
        </Badge>
      );
    default:
      return <Badge variant="outline">{category}</Badge>;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Page ───────────────────────────────────────────────────────────

export default function NewsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          ข่าวสารและประกาศ
        </h1>
        <p className="mt-2 text-muted-foreground">
          ติดตามข่าวสาร ประกาศ และอัปเดตล่าสุดจาก U-Exam
        </p>
      </div>

      {/* News Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {newsItems.map((item) => (
          <Card
            key={item.id}
            className="flex flex-col transition-shadow hover:shadow-md"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                {getCategoryBadge(item.category)}
              </div>
              <CardTitle className="mt-3 text-base leading-snug">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription className="text-sm leading-relaxed">
                {item.excerpt}
              </CardDescription>
            </CardContent>
            <div className="px-6 pb-5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(item.date)}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
