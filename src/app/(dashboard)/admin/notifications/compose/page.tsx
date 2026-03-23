"use client";

import { useState, useEffect } from "react";
import {
  Send,
  Mail,
  Users,
  UserCheck,
  Briefcase,
  Loader2,
  Plus,
  X,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import Link from "next/link";

const RECIPIENTS = [
  { value: "all", label: "ทุกคนในระบบ", icon: Users, desc: "ผู้ใช้ทั้งหมดใน Tenant" },
  { value: "candidates", label: "ผู้สอบทั้งหมด", icon: UserCheck, desc: "เฉพาะ Candidate" },
  { value: "by_exam", label: "ผู้สมัครรายวิชา", icon: BookOpen, desc: "เฉพาะผู้สมัครวิชาที่เลือก" },
  { value: "staff", label: "เจ้าหน้าที่", icon: Briefcase, desc: "Admin, Creator, Grader, Proctor, ศูนย์สอบ" },
  { value: "custom", label: "กำหนดเอง", icon: Mail, desc: "ระบุอีเมลเอง" },
] as const;

interface ExamOption {
  id: string;
  title: string;
  _count?: { schedules?: number };
}

export default function ComposeEmailPage() {
  const [to, setTo] = useState<string>("all");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sendInApp, setSendInApp] = useState(true);
  const [customEmails, setCustomEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Load exams when "by_exam" is selected
  useEffect(() => {
    if (to === "by_exam" && exams.length === 0) {
      fetch("/api/v1/exams?perPage=100")
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setExams(json.data ?? []);
        })
        .catch(() => {});
    }
  }, [to, exams.length]);

  const addEmail = () => {
    const email = emailInput.trim();
    if (email && email.includes("@") && !customEmails.includes(email)) {
      setCustomEmails((prev) => [...prev, email]);
      setEmailInput("");
    }
  };

  const removeEmail = (email: string) => {
    setCustomEmails((prev) => prev.filter((e) => e !== email));
  };

  const handleSend = async () => {
    setConfirmOpen(false);
    setIsSending(true);
    try {
      const res = await fetch("/api/v1/notifications/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          customEmails: to === "custom" ? customEmails : undefined,
          examId: to === "by_exam" ? selectedExamId : undefined,
          subject,
          message,
          sendInApp,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.data?.message || "ส่งสำเร็จ");
        setSubject("");
        setMessage("");
        setCustomEmails([]);
      } else {
        toast.error(json.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSending(false);
    }
  };

  const recipientLabel = RECIPIENTS.find((r) => r.value === to)?.label ?? to;
  const canSend =
    subject.trim() &&
    message.trim() &&
    (to !== "custom" || customEmails.length > 0) &&
    (to !== "by_exam" || selectedExamId);

  const selectedExamTitle = exams.find((e) => e.id === selectedExamId)?.title;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/notifications">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ส่งอีเมล</h1>
          <p className="text-sm text-muted-foreground">
            ส่งอีเมลแจ้งเตือนไปยังผู้ใช้ในระบบ
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            เขียนอีเมล
          </CardTitle>
          <CardDescription>กรอกรายละเอียดอีเมลที่ต้องการส่ง</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Recipients */}
          <div className="space-y-2">
            <Label>ผู้รับ <span className="text-destructive">*</span></Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECIPIENTS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <div className="flex items-center gap-2">
                      <r.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{r.label}</span>
                      <span className="text-xs text-muted-foreground">
                        — {r.desc}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom emails */}
          {to === "custom" && (
            <div className="space-y-2">
              <Label>อีเมลผู้รับ</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="email@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addEmail();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={addEmail}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {customEmails.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {customEmails.map((email) => (
                    <Badge
                      key={email}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {email}
                      <button
                        onClick={() => removeEmail(email)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Exam selector */}
          {to === "by_exam" && (
            <div className="space-y-2">
              <Label>เลือกวิชา <span className="text-destructive">*</span></Label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกวิชาที่ต้องการส่ง" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedExamId && (
                <p className="text-xs text-muted-foreground">
                  จะส่งอีเมลถึงผู้สมัครทุกคนที่ลงทะเบียนในวิชา &quot;{selectedExamTitle}&quot;
                </p>
              )}
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label>หัวข้อ <span className="text-destructive">*</span></Label>
            <Input
              placeholder="หัวข้ออีเมล"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>ข้อความ <span className="text-destructive">*</span></Label>
            <Textarea
              placeholder="เนื้อหาอีเมลที่ต้องการส่ง..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/5,000
            </p>
          </div>

          {/* Options */}
          {to !== "custom" && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">
                  ส่งแจ้งเตือน In-App ด้วย
                </p>
                <p className="text-xs text-muted-foreground">
                  นอกจากอีเมล จะสร้างแจ้งเตือนในระบบให้ผู้ใช้เห็นด้วย
                </p>
              </div>
              <Switch checked={sendInApp} onCheckedChange={setSendInApp} />
            </div>
          )}

          {/* Send Button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={!canSend || isSending}
              className="gap-2"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              ส่งอีเมล
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการส่งอีเมล</AlertDialogTitle>
            <AlertDialogDescription>
              ส่งอีเมลหัวข้อ &quot;{subject}&quot; ไปยัง{" "}
              <strong>
                {to === "custom"
                  ? `${customEmails.length} อีเมล`
                  : to === "by_exam"
                  ? `ผู้สมัครวิชา "${selectedExamTitle}"`
                  : recipientLabel}
              </strong>{" "}
              ต้องการดำเนินการหรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>
              ส่งอีเมล
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
