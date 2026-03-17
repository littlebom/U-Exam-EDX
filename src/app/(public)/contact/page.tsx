"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

// ─── Contact Info ───────────────────────────────────────────────────

const contactInfo = [
  {
    icon: Mail,
    label: "อีเมล",
    value: "support@u-exam.com",
    description: "ตอบกลับภายใน 24 ชั่วโมง",
  },
  {
    icon: Phone,
    label: "โทรศัพท์",
    value: "02-123-4567",
    description: "จันทร์ - ศุกร์ 9:00 - 17:00 น.",
  },
  {
    icon: MapPin,
    label: "ที่อยู่",
    value: "อาคาร U-Exam Tower ชั้น 10",
    description: "ถนนพหลโยธิน แขวงจตุจักร กรุงเทพฯ 10900",
  },
  {
    icon: Clock,
    label: "เวลาทำการ",
    value: "จันทร์ - ศุกร์",
    description: "9:00 - 17:00 น. (ยกเว้นวันหยุดนักขัตฤกษ์)",
  },
];

// ─── Page ───────────────────────────────────────────────────────────

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    // Simulate sending (MVP — no actual backend)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("ส่งข้อความเรียบร้อยแล้ว! เราจะติดต่อกลับโดยเร็วที่สุด");
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setIsSending(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          ติดต่อเรา
        </h1>
        <p className="mt-2 text-muted-foreground">
          มีคำถามหรือต้องการความช่วยเหลือ? ติดต่อทีมงาน U-Exam ได้ตลอดเวลา
        </p>
      </div>

      {/* Content Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Contact Info */}
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {contactInfo.map((item) => (
              <Card key={item.label}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-sm font-semibold">{item.value}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Map Placeholder */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex aspect-video items-center justify-center rounded-lg bg-muted">
                <div className="text-center text-muted-foreground">
                  <MapPin className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm font-medium">แผนที่</p>
                  <p className="text-xs">
                    อาคาร U-Exam Tower ถนนพหลโยธิน กรุงเทพฯ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ส่งข้อความถึงเรา</CardTitle>
            <CardDescription>
              กรอกแบบฟอร์มด้านล่าง เราจะติดต่อกลับโดยเร็วที่สุด
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                  <Input
                    id="name"
                    placeholder="ชื่อของคุณ"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">หัวข้อ</Label>
                <Input
                  id="subject"
                  placeholder="หัวข้อที่ต้องการสอบถาม"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">ข้อความ</Label>
                <Textarea
                  id="message"
                  placeholder="รายละเอียดที่ต้องการแจ้ง..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    ส่งข้อความ
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
