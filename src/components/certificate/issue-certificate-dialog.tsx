"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Award, Search, User, BookOpen, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────

interface CandidateOption {
  id: string;
  name: string;
  email: string;
}

interface ExamOption {
  id: string;
  title: string;
}

interface EligibleSession {
  gradeId: string;
  sessionId: string;
  scheduleId: string;
  examTitle: string;
  examDate: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  gradedAt: string;
}

interface TemplateOption {
  id: string;
  name: string;
  isDefault: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIssued: () => void;
}

// ─── Debounce hook ──────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Component ──────────────────────────────────────────────────────

export function IssueCertificateDialog({ open, onOpenChange, onIssued }: Props) {
  // Search state
  const [candidateQuery, setCandidateQuery] = useState("");
  const [examQuery, setExamQuery] = useState("");
  const debouncedCandidateQuery = useDebounce(candidateQuery, 300);
  const debouncedExamQuery = useDebounce(examQuery, 300);

  // Results
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [sessions, setSessions] = useState<EligibleSession[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);

  // Selections
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateOption | null>(null);
  const [selectedExam, setSelectedExam] = useState<ExamOption | null>(null);
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [templateId, setTemplateId] = useState("");

  // Loading
  const [searchingCandidates, setSearchingCandidates] = useState(false);
  const [searchingExams, setSearchingExams] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setCandidateQuery("");
      setExamQuery("");
      setCandidates([]);
      setExams([]);
      setSessions([]);
      setSelectedCandidate(null);
      setSelectedExam(null);
      setSelectedGradeId("");
      setTemplateId("");
      return;
    }
    // Load templates on open
    fetch("/api/v1/certificates/templates")
      .then((r) => r.json())
      .then((json) => {
        const tpls = json.data ?? [];
        setTemplates(tpls);
        const def = tpls.find((t: TemplateOption) => t.isDefault);
        if (def) setTemplateId(def.id);
      });
  }, [open]);

  // Search candidates
  useEffect(() => {
    if (debouncedCandidateQuery.length < 2) {
      setCandidates([]);
      return;
    }
    setSearchingCandidates(true);
    fetch(`/api/v1/certificates/eligible?candidateQuery=${encodeURIComponent(debouncedCandidateQuery)}`)
      .then((r) => r.json())
      .then((json) => setCandidates(json.data?.candidates ?? []))
      .finally(() => setSearchingCandidates(false));
  }, [debouncedCandidateQuery]);

  // Search exams
  useEffect(() => {
    if (debouncedExamQuery.length < 2) {
      setExams([]);
      return;
    }
    setSearchingExams(true);
    fetch(`/api/v1/certificates/eligible?examQuery=${encodeURIComponent(debouncedExamQuery)}`)
      .then((r) => r.json())
      .then((json) => setExams(json.data?.exams ?? []))
      .finally(() => setSearchingExams(false));
  }, [debouncedExamQuery]);

  // Load eligible sessions when both selected
  useEffect(() => {
    if (!selectedCandidate || !selectedExam) {
      setSessions([]);
      setSelectedGradeId("");
      return;
    }
    setLoadingSessions(true);
    fetch(
      `/api/v1/certificates/eligible?candidateId=${selectedCandidate.id}&examId=${selectedExam.id}`
    )
      .then((r) => r.json())
      .then((json) => {
        const list = json.data?.sessions ?? [];
        setSessions(list);
        if (list.length === 1) setSelectedGradeId(list[0].gradeId);
      })
      .finally(() => setLoadingSessions(false));
  }, [selectedCandidate, selectedExam]);

  const handleSelectCandidate = useCallback((c: CandidateOption) => {
    setSelectedCandidate(c);
    setCandidateQuery("");
    setCandidates([]);
  }, []);

  const handleSelectExam = useCallback((e: ExamOption) => {
    setSelectedExam(e);
    setExamQuery("");
    setExams([]);
  }, []);

  const selectedSession = sessions.find((s) => s.gradeId === selectedGradeId);

  const handleIssue = async () => {
    if (!templateId || !selectedGradeId || !selectedCandidate) {
      toast.error("กรุณาเลือกข้อมูลให้ครบ");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          candidateId: selectedCandidate.id,
          gradeId: selectedGradeId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`ออกใบรับรองสำเร็จ — ${json.data?.certificateNumber ?? ""}`);
        onOpenChange(false);
        onIssued();
      } else {
        toast.error(json.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            ออกใบรับรองด้วยตนเอง
          </DialogTitle>
          <DialogDescription>
            ค้นหาผู้สอบและวิชา จากนั้นเลือกผลสอบที่ผ่านเกณฑ์
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* ─── Step 1: ค้นหาผู้สอบ ─────────────────────────── */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              ผู้สอบ <span className="text-destructive">*</span>
            </Label>

            {selectedCandidate ? (
              <div className="flex items-center justify-between rounded-lg border p-2.5">
                <div>
                  <p className="text-sm font-medium">{selectedCandidate.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedCandidate.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCandidate(null);
                    setSessions([]);
                    setSelectedGradeId("");
                  }}
                >
                  เปลี่ยน
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="พิมพ์ชื่อหรืออีเมลผู้สอบ (อย่างน้อย 2 ตัวอักษร)..."
                  value={candidateQuery}
                  onChange={(e) => setCandidateQuery(e.target.value)}
                  className="pl-9"
                />
                {searchingCandidates && (
                  <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}

                {/* Dropdown results */}
                {candidates.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
                    {candidates.map((c) => (
                      <button
                        key={c.id}
                        className="w-full px-3 py-2 text-left hover:bg-accent text-sm flex flex-col"
                        onClick={() => handleSelectCandidate(c)}
                      >
                        <span className="font-medium">{c.name}</span>
                        <span className="text-xs text-muted-foreground">{c.email}</span>
                      </button>
                    ))}
                  </div>
                )}

                {candidateQuery.length >= 2 && !searchingCandidates && candidates.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">ไม่พบผู้สอบที่ตรงกัน</p>
                )}
              </div>
            )}
          </div>

          {/* ─── Step 2: ค้นหาวิชา ──────────────────────────── */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              วิชา <span className="text-destructive">*</span>
            </Label>

            {selectedExam ? (
              <div className="flex items-center justify-between rounded-lg border p-2.5">
                <p className="text-sm font-medium">{selectedExam.title}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedExam(null);
                    setSessions([]);
                    setSelectedGradeId("");
                  }}
                >
                  เปลี่ยน
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="พิมพ์ชื่อวิชา (อย่างน้อย 2 ตัวอักษร)..."
                  value={examQuery}
                  onChange={(e) => setExamQuery(e.target.value)}
                  className="pl-9"
                />
                {searchingExams && (
                  <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}

                {exams.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
                    {exams.map((e) => (
                      <button
                        key={e.id}
                        className="w-full px-3 py-2 text-left hover:bg-accent text-sm font-medium"
                        onClick={() => handleSelectExam(e)}
                      >
                        {e.title}
                      </button>
                    ))}
                  </div>
                )}

                {examQuery.length >= 2 && !searchingExams && exams.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">ไม่พบวิชาที่ตรงกัน</p>
                )}
              </div>
            )}
          </div>

          {/* ─── Step 3: เลือก Session ที่ผ่าน ──────────────── */}
          {selectedCandidate && selectedExam && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                ผลสอบที่ผ่านเกณฑ์ <span className="text-destructive">*</span>
              </Label>

              {loadingSessions ? (
                <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังค้นหา...
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2 rounded-lg border p-3 bg-muted/30">
                  ไม่พบผลสอบที่ผ่านเกณฑ์ (CONFIRMED + isPassed) หรือออกใบรับรองไปแล้ว
                </p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <button
                      key={s.gradeId}
                      className={`w-full text-left rounded-lg border p-3 text-sm transition-colors ${
                        selectedGradeId === s.gradeId
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "hover:bg-accent"
                      }`}
                      onClick={() => setSelectedGradeId(s.gradeId)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{s.examTitle}</span>
                        <Badge variant="secondary" className="text-xs">
                          {s.totalScore}/{s.maxScore} ({s.percentage.toFixed(1)}%)
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        สอบเมื่อ{" "}
                        {new Date(s.examDate).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {" "}— ตรวจเมื่อ{" "}
                        {new Date(s.gradedAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Template ────────────────────────────────────── */}
          <div className="space-y-2">
            <Label>
              เทมเพลต <span className="text-destructive">*</span>
            </Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกเทมเพลต" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} {t.isDefault ? "(Default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleIssue}
            disabled={isSubmitting || !templateId || !selectedGradeId || !selectedCandidate}
            className="gap-1.5"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            ออกใบรับรอง
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
