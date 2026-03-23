"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CloudUpload,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSimpleList } from "@/hooks/use-api";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────

interface PreviewRow {
  row: number;
  type: string;
  difficulty: string;
  content: string;
  correctAnswer: string;
  points: number;
  subjectCode: string;
}

interface ErrorRow {
  row: number;
  message: string;
}

interface PreviewResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  preview: PreviewRow[];
  errors: ErrorRow[];
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: ErrorRow[];
}

interface SubjectOption {
  id: string;
  code: string;
  name: string;
}

const NONE_VALUE = "__none__";

// ─── Page ───────────────────────────────────────────────────────────

export default function ImportPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [subjectId, setSubjectId] = useState("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const searchParams = useSearchParams();
  const { data: subjects } = useSimpleList<SubjectOption>("subjects-import", "/api/v1/subjects");

  // Auto-select subject from URL query param
  useEffect(() => {
    const sid = searchParams.get("subjectId");
    if (sid && !subjectId) setSubjectId(sid);
  }, [searchParams, subjectId]);

  // Handle file selection
  const handleFile = async (f: File) => {
    setFile(f);
    setPreview(null);
    setImportResult(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", f);
      formData.append("mode", "preview");
      if (subjectId) formData.append("subjectId", subjectId);

      const res = await fetch("/api/v1/questions/import", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (json.success) {
        setPreview(json.data);
        setStep("preview");
      } else {
        toast.error(json.error?.message || "ไม่สามารถอ่านไฟล์ได้");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการอ่านไฟล์");
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm import
  const handleImport = async () => {
    if (!file) return;
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", "import");
      if (subjectId) formData.append("subjectId", subjectId);

      const res = await fetch("/api/v1/questions/import", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (json.success) {
        setImportResult(json.data);
        setStep("done");
        toast.success(`นำเข้าสำเร็จ ${json.data.success} จาก ${json.data.total} ข้อ`);
      } else {
        toast.error(json.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setImportResult(null);
    setStep("upload");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">นำเข้าข้อสอบ</h1>
        <p className="text-sm text-muted-foreground">
          อัปโหลดไฟล์ Excel (.xlsx) หรือ CSV เพื่อนำเข้าข้อสอบเข้าสู่ระบบ
        </p>
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4" />
                อัปโหลดไฟล์
              </CardTitle>
              <CardDescription>เลือกไฟล์ Excel หรือ CSV ที่มีข้อสอบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subject selector */}
              <div className="space-y-2">
                <Label>วิชา (ไม่บังคับ)</Label>
                <Select value={subjectId || NONE_VALUE} onValueChange={(v) => setSubjectId(v === NONE_VALUE ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกวิชา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>— ไม่กำหนด —</SelectItem>
                    {(subjects ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        [{s.code}] {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  หรือระบุ subject_code ในไฟล์แต่ละแถว
                </p>
              </div>

              {/* Drop zone */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <div
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFile(f);
                }}
              >
                {isLoading ? (
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-3" />
                ) : (
                  <CloudUpload className="h-10 w-10 text-muted-foreground/50 mb-3" />
                )}
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {isLoading ? "กำลังอ่านไฟล์..." : "ลากไฟล์มาวางที่นี่"}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  รองรับ .xlsx, .xls, .csv (สูงสุด 500 ข้อ)
                </p>
                {!isLoading && (
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    เลือกไฟล์
                  </Button>
                )}
              </div>

              {/* Formats */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  Excel (.xlsx)
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <FileText className="h-3 w-3" />
                  CSV (.csv)
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Template download */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-4 w-4" />
                Template ตัวอย่าง
              </CardTitle>
              <CardDescription>ดาวน์โหลด template สำหรับกรอกข้อสอบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-muted/50 p-4 text-sm space-y-2">
                <p className="font-medium">คอลัมน์ที่รองรับ:</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">คอลัมน์</TableHead>
                      <TableHead className="text-xs">คำอธิบาย</TableHead>
                      <TableHead className="text-xs">บังคับ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ["type", "ประเภท: MC, TF, SHORT_ANSWER, ESSAY", "✓"],
                      ["difficulty", "ระดับ: EASY, MEDIUM, HARD", ""],
                      ["content", "คำถาม", "✓"],
                      ["option_a - option_e", "ตัวเลือก (สำหรับ MC)", ""],
                      ["correct_answer", "คำตอบที่ถูก (A/B/C/D หรือ true/false)", "✓"],
                      ["explanation", "คำอธิบายเฉลย", ""],
                      ["points", "คะแนน (default: 1)", ""],
                      ["subject_code", "รหัสวิชา", ""],
                    ].map(([col, desc, req]) => (
                      <TableRow key={col}>
                        <TableCell className="text-xs font-mono">{col}</TableCell>
                        <TableCell className="text-xs">{desc}</TableCell>
                        <TableCell className="text-xs text-center">{req}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Preview */}
      {step === "preview" && preview && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ทั้งหมด</span>
                  <FileSpreadsheet className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="mt-1 text-2xl font-bold">{preview.totalRows}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ถูกต้อง</span>
                  <CheckCircle2 className="h-5 w-5 text-green-500/50" />
                </div>
                <p className="mt-1 text-2xl font-bold text-green-600">{preview.validRows}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ข้อผิดพลาด</span>
                  <XCircle className="h-5 w-5 text-red-500/50" />
                </div>
                <p className="mt-1 text-2xl font-bold text-red-600">{preview.errorRows}</p>
              </CardContent>
            </Card>
          </div>

          {/* Errors */}
          {preview.errors.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-900/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-amber-800 dark:text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  แถวที่มีปัญหา ({preview.errors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  {preview.errors.slice(0, 10).map((err, i) => (
                    <p key={i} className="text-amber-700 dark:text-amber-300">
                      แถว {err.row}: {err.message}
                    </p>
                  ))}
                  {preview.errors.length > 10 && (
                    <p className="text-muted-foreground">
                      ... และอีก {preview.errors.length - 10} ข้อ
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview table */}
          {preview.preview.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">ตัวอย่างข้อมูล (10 แถวแรก)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>ระดับ</TableHead>
                      <TableHead>คำถาม</TableHead>
                      <TableHead>คำตอบ</TableHead>
                      <TableHead>คะแนน</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.preview.map((row) => (
                      <TableRow key={row.row}>
                        <TableCell className="text-xs">{row.row}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{row.type}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{row.difficulty}</TableCell>
                        <TableCell className="text-sm max-w-[300px] truncate">{row.content}</TableCell>
                        <TableCell className="text-xs">{row.correctAnswer}</TableCell>
                        <TableCell className="text-xs">{row.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={reset}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleImport}
              disabled={isLoading || preview.validRows === 0}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              นำเข้า {preview.validRows} ข้อ
            </Button>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && importResult && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">นำเข้าเสร็จสิ้น!</h2>
            <p className="text-muted-foreground mb-6">
              สำเร็จ {importResult.success} จาก {importResult.total} ข้อ
              {importResult.failed > 0 && ` (ล้มเหลว ${importResult.failed})`}
            </p>
            {importResult.errors.length > 0 && (
              <div className="mb-6 text-sm text-amber-700 dark:text-amber-300 max-w-md">
                {importResult.errors.slice(0, 5).map((err, i) => (
                  <p key={i}>แถว {err.row}: {err.message}</p>
                ))}
              </div>
            )}
            <Button onClick={reset} className="gap-2">
              <Upload className="h-4 w-4" />
              นำเข้าเพิ่ม
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
