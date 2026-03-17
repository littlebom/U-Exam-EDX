"use client";

import Link from "next/link";
import {
  GraduationCap,
  Library,
  Building2,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Shield,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Library,
    title: "คลังข้อสอบ",
    description:
      "สร้างและจัดการข้อสอบหลากหลายรูปแบบ ทั้งปรนัย อัตนัย จับคู่ เรียงลำดับ และเติมคำ พร้อมระบบจัดหมวดหมู่อัจฉริยะ",
  },
  {
    icon: Building2,
    title: "ศูนย์สอบ",
    description:
      "บริหารจัดการศูนย์สอบครบวงจร ตั้งแต่การจองที่นั่ง ตรวจสอบอุปกรณ์ ไปจนถึงการจัดการบุคลากรและดำเนินการสอบ",
  },
  {
    icon: BarChart3,
    title: "วิเคราะห์ผลสอบ",
    description:
      "รายงานและสถิติเชิงลึก วิเคราะห์คุณภาพข้อสอบ ติดตามพัฒนาการผู้สอบ พร้อมแดชบอร์ดแบบ Real-time",
  },
];

const highlights = [
  "รองรับการสอบสาธารณะและองค์กร",
  "ระบบ Anti-cheat และ Proctoring",
  "ใบ Certificate และ Digital Badge",
  "รองรับหลายภาษา (ไทย/อังกฤษ)",
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
              <Shield className="h-4 w-4 text-primary" />
              Enterprise-grade Examination Platform
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-primary">U-Exam</span>
              <br />
              <span className="mt-2 block text-2xl font-semibold text-muted-foreground sm:text-3xl lg:text-4xl">
                ระบบบริหารจัดการสอบออนไลน์
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              แพลตฟอร์มบริหารจัดการสอบครบวงจร
              รองรับการสอบสาธารณะและองค์กร ตั้งแต่สร้างข้อสอบ จัดสอบ ตรวจให้คะแนน
              ไปจนถึงออกใบรับรอง
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/catalog">
                <Button size="lg" className="gap-2">
                  ดูตารางสอบ
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="gap-2">
                  <Globe className="h-4 w-4" />
                  เข้าสู่ระบบ
                </Button>
              </Link>
            </div>

            {/* Highlights */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              ฟีเจอร์หลัก
            </h2>
            <p className="mt-3 text-muted-foreground">
              เครื่องมือครบครันสำหรับบริหารจัดการสอบทุกรูปแบบ
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-2xl bg-primary p-8 text-center text-primary-foreground sm:p-12">
            <GraduationCap className="mx-auto mb-4 h-10 w-10" />
            <h2 className="text-2xl font-bold sm:text-3xl">
              พร้อมเริ่มจัดสอบแล้วหรือยัง?
            </h2>
            <p className="mt-3 text-primary-foreground/80">
              สมัครใช้งาน U-Exam วันนี้ เริ่มต้นได้ทันที
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/login">
                <Button
                  variant="secondary"
                  size="lg"
                  className="gap-2"
                >
                  เริ่มต้นใช้งาน
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
