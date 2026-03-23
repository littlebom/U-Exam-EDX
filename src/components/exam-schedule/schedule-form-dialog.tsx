"use client";

import { useState, useEffect } from "react";
import { Loader2, ScanFace, QrCode, Keyboard, ClipboardCheck, Globe, MapPin, Shield, Eye, Camera, MonitorSmartphone, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  type CheckinSettings,
  type CheckinMethod,
  DEFAULT_CHECKIN_SETTINGS,
  CHECKIN_METHOD_LABELS,
} from "@/lib/validations/checkin";
import {
  type ProctoringSettings,
  type ProctoringMode,
  type ScreenshotMode,
  DEFAULT_PROCTORING_SETTINGS,
} from "@/lib/validations/proctoring";
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
import { useSimpleList } from "@/hooks/use-api";
import {
  createScheduleAction,
  updateScheduleAction,
} from "@/actions/exam-schedule.actions";
import { toast } from "sonner";
import type { ScheduleRow } from "./schedule-card";

// ============================================================
// Types
// ============================================================

interface ExamOption {
  id: string;
  title: string;
  status: string;
}

interface TestCenterOption {
  id: string;
  name: string;
  code: string;
}

interface RoomOption {
  id: string;
  name: string;
  code: string;
  capacity: number | null;
}

interface ScheduleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: ScheduleRow | null;
  onSaved: () => void;
}

// ============================================================
// Helpers
// ============================================================

function toDatetimeLocal(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Special value for "none" select option (shadcn Select doesn't allow empty string)
const NONE_VALUE = "__none__";

// ============================================================
// Component
// ============================================================

export function ScheduleFormDialog({
  open,
  onOpenChange,
  schedule,
  onSaved,
}: ScheduleFormDialogProps) {
  const isEdit = !!schedule;

  const [examType, setExamType] = useState<"ONLINE" | "ONSITE">("ONSITE");
  const [examId, setExamId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [maxCandidates, setMaxCandidates] = useState("");
  const [registrationOpenDate, setRegistrationOpenDate] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [testCenterId, setTestCenterId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [registrationFee, setRegistrationFee] = useState("");
  const [checkin, setCheckin] = useState<CheckinSettings>(DEFAULT_CHECKIN_SETTINGS);
  const [proctoring, setProctoring] = useState<ProctoringSettings>(DEFAULT_PROCTORING_SETTINGS);
  const [certificateTemplateId, setCertificateTemplateId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Load exams for select
  const { data: exams } = useSimpleList<ExamOption>("exams", "/api/v1/exams");

  // Load test centers
  const { data: testCenters } = useSimpleList<TestCenterOption>(
    "test-centers",
    "/api/v1/test-centers?perPage=100"
  );

  // Load certificate templates
  const { data: certTemplates } = useSimpleList<{ id: string; name: string; isDefault: boolean }>(
    "cert-templates-list",
    "/api/v1/certificates/templates"
  );

  // Load rooms filtered by selected test center (cascading)
  const roomsUrl = testCenterId
    ? `/api/v1/rooms?testCenterId=${testCenterId}&perPage=100`
    : null;
  const { data: rooms } = useSimpleList<RoomOption>(
    testCenterId ? `rooms-${testCenterId}` : "rooms-none",
    roomsUrl ?? ""
  );

  // When test center changes, reset room selection
  const handleTestCenterChange = (value: string) => {
    const newValue = value === NONE_VALUE ? "" : value;
    setTestCenterId(newValue);
    setRoomId(""); // Reset room when center changes
  };

  const handleRoomChange = (value: string) => {
    setRoomId(value === NONE_VALUE ? "" : value);
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (schedule) {
        setExamType((schedule as unknown as Record<string, string>).examType === "ONLINE" ? "ONLINE" : "ONSITE");
        setExamId(schedule.examId);
        setStartDate(toDatetimeLocal(schedule.startDate));
        setEndDate(toDatetimeLocal(schedule.endDate));
        setLocation(schedule.location ?? "");
        setMaxCandidates(
          schedule.maxCandidates ? String(schedule.maxCandidates) : ""
        );
        setRegistrationOpenDate(
          toDatetimeLocal(schedule.registrationOpenDate)
        );
        setRegistrationDeadline(
          toDatetimeLocal(schedule.registrationDeadline)
        );
        setTestCenterId(schedule.testCenterId ?? "");
        setRoomId(schedule.roomId ?? "");
        setRegistrationFee(
          schedule.registrationFee ? String(schedule.registrationFee) : ""
        );
        // Load check-in settings + certificate template
        const schedSettings = schedule.settings as Record<string, unknown> | null;
        const existingCheckin = schedSettings?.checkin as Partial<CheckinSettings> | undefined;
        setCheckin({ ...DEFAULT_CHECKIN_SETTINGS, ...existingCheckin });
        setCertificateTemplateId((schedSettings?.certificateTemplateId as string) ?? "");
        // Load proctoring settings
        const existingProctoring = schedSettings?.proctoring as Partial<ProctoringSettings> | undefined;
        setProctoring({ ...DEFAULT_PROCTORING_SETTINGS, ...existingProctoring });
      } else {
        setExamType("ONSITE");
        setExamId("");
        setStartDate("");
        setEndDate("");
        setLocation("");
        setMaxCandidates("");
        setRegistrationOpenDate("");
        setRegistrationDeadline("");
        setTestCenterId("");
        setRoomId("");
        setRegistrationFee("");
        setCheckin(DEFAULT_CHECKIN_SETTINGS);
        setProctoring(DEFAULT_PROCTORING_SETTINGS);
        setCertificateTemplateId("");
      }
      setFieldErrors({});
    }
  }, [open, schedule]);

  const handleSubmit = async () => {
    setFieldErrors({});

    // Client-side validation
    if (!isEdit && !examId) {
      setFieldErrors({ examId: ["กรุณาเลือกชุดข้อสอบ"] });
      return;
    }
    if (!startDate) {
      setFieldErrors({ startDate: ["กรุณาระบุวันเวลาเริ่มสอบ"] });
      return;
    }
    if (!endDate) {
      setFieldErrors({ endDate: ["กรุณาระบุวันเวลาสิ้นสุดสอบ"] });
      return;
    }

    setIsSubmitting(true);
    try {
      const isOnline = examType === "ONLINE";
      const payload = {
        ...(isEdit ? {} : { examId }),
        examType,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        location: isOnline ? null : (location || null),
        maxCandidates: maxCandidates ? parseInt(maxCandidates) : null,
        registrationOpenDate: registrationOpenDate
          ? new Date(registrationOpenDate).toISOString()
          : null,
        registrationDeadline: registrationDeadline
          ? new Date(registrationDeadline).toISOString()
          : null,
        testCenterId: isOnline ? null : (testCenterId || null),
        roomId: isOnline ? null : (roomId || null),
        registrationFee: registrationFee ? parseFloat(registrationFee) : 0,
        settings: {
          ...(schedule?.settings as Record<string, unknown> ?? {}),
          checkin: isOnline ? { ...DEFAULT_CHECKIN_SETTINGS, enableCheckin: false } : checkin,
          proctoring,
          certificateTemplateId: certificateTemplateId || null,
        },
      };

      const result = isEdit
        ? await updateScheduleAction(schedule!.id, payload)
        : await createScheduleAction(payload);

      if (result.success) {
        toast.success(isEdit ? "แก้ไขรอบสอบสำเร็จ" : "สร้างรอบสอบสำเร็จ");
        onOpenChange(false);
        onSaved();
      } else if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
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
          <DialogTitle>
            {isEdit ? "แก้ไขรอบสอบ" : "เพิ่มรอบสอบ"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "แก้ไขข้อมูลรอบสอบที่เลือก"
              : "กำหนดรอบสอบใหม่สำหรับชุดข้อสอบ"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Exam Type */}
          <div className="space-y-2">
            <Label>ประเภทการสอบ <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExamType("ONLINE")}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                  examType === "ONLINE"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                <Globe className="h-4 w-4" />
                Online
              </button>
              <button
                type="button"
                onClick={() => setExamType("ONSITE")}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                  examType === "ONSITE"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                <MapPin className="h-4 w-4" />
                Onsite
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {examType === "ONLINE"
                ? "สอบออนไลน์ — ไม่ต้องเช็คอิน ไม่ต้องเลือกที่นั่ง/ศูนย์สอบ"
                : "สอบที่ศูนย์สอบ — เลือกศูนย์สอบ ห้องสอบ และตั้งค่าเช็คอินได้"}
            </p>
          </div>

          {/* Exam Select (create only) */}
          {!isEdit && (
            <div className="space-y-2">
              <Label>
                ชุดข้อสอบ <span className="text-destructive">*</span>
              </Label>
              <Select value={examId} onValueChange={setExamId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกชุดข้อสอบ" />
                </SelectTrigger>
                <SelectContent>
                  {(exams ?? []).map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.examId && (
                <p className="text-xs text-destructive">{fieldErrors.examId[0]}</p>
              )}
            </div>
          )}

          {/* Exam Date/Time Section */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">กำหนดการสอบ</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  วันเวลาเริ่มสอบ <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm"
                />
                {fieldErrors.startDate && (
                  <p className="text-xs text-destructive">{fieldErrors.startDate[0]}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  วันเวลาสิ้นสุดสอบ <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-sm"
                />
                {fieldErrors.endDate && (
                  <p className="text-xs text-destructive">{fieldErrors.endDate[0]}</p>
                )}
              </div>
            </div>
          </div>

          {/* Registration Period Section */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">ช่วงรับสมัคร</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">วันเปิดรับสมัคร</Label>
                <Input
                  type="datetime-local"
                  value={registrationOpenDate}
                  onChange={(e) => setRegistrationOpenDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">วันปิดรับสมัคร</Label>
                <Input
                  type="datetime-local"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              หากไม่ระบุ จะเปิดรับสมัครตั้งแต่สร้างรอบสอบจนถึงวันสอบ
            </p>
          </div>

          {/* Test Center & Room Section — Onsite only */}
          {examType === "ONSITE" && <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">ศูนย์สอบ / ห้องสอบ</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">ศูนย์สอบ</Label>
                <Select
                  value={testCenterId || NONE_VALUE}
                  onValueChange={handleTestCenterChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกศูนย์สอบ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>— ไม่ระบุ —</SelectItem>
                    {(testCenters ?? []).map((tc) => (
                      <SelectItem key={tc.id} value={tc.id}>
                        {tc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ห้องสอบ</Label>
                <Select
                  value={roomId || NONE_VALUE}
                  onValueChange={handleRoomChange}
                  disabled={!testCenterId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        testCenterId ? "เลือกห้องสอบ" : "เลือกศูนย์สอบก่อน"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>— ไม่ระบุ —</SelectItem>
                    {(rooms ?? []).map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                        {r.capacity ? ` (${r.capacity} ที่นั่ง)` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              เลือกศูนย์สอบก่อนเพื่อดูรายการห้องสอบที่มี
            </p>
          </div>
          }

          {/* Location (free text) — Onsite only */}
          {examType === "ONSITE" && (
            <div className="space-y-2">
              <Label>สถานที่เพิ่มเติม</Label>
              <Input
                placeholder="เช่น ชั้น 3 อาคาร A"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          )}

          {/* Max Candidates & Registration Fee */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>จำนวนผู้สอบสูงสุด</Label>
              <Input
                type="number"
                min={1}
                placeholder="ไม่จำกัด"
                value={maxCandidates}
                onChange={(e) => setMaxCandidates(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>ค่าสมัครสอบ (บาท)</Label>
              <Input
                type="number"
                min={0}
                step={1}
                placeholder="0 = ฟรี"
                value={registrationFee}
                onChange={(e) => setRegistrationFee(e.target.value)}
              />
              {fieldErrors.registrationFee && (
                <p className="text-xs text-destructive">
                  {fieldErrors.registrationFee[0]}
                </p>
              )}
            </div>
          </div>

          {/* ── Certificate Template ── */}
          <div className="space-y-2">
            <Label>เทมเพลตใบประกาศนียบัตร</Label>
            <Select
              value={certificateTemplateId || NONE_VALUE}
              onValueChange={(v) => setCertificateTemplateId(v === NONE_VALUE ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกเทมเพลต (ไม่บังคับ)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>— ไม่กำหนด —</SelectItem>
                {(certTemplates ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} {t.isDefault ? "(Default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              กำหนดเทมเพลตสำหรับออกใบประกาศนียบัตรเมื่อผู้สอบผ่านเกณฑ์
            </p>
          </div>

          {/* ── Check-in Settings — Onsite only ── */}
          {examType === "ONSITE" && (
          <div>
          <Separator className="my-2" />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">การเช็คอิน</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">เปิดระบบเช็คอิน</Label>
                <p className="text-xs text-muted-foreground">
                  ผู้สอบต้องเช็คอินก่อนเข้าห้องสอบ
                </p>
              </div>
              <Switch
                checked={checkin.enableCheckin}
                onCheckedChange={(v) => setCheckin((p) => ({ ...p, enableCheckin: v }))}
              />
            </div>

            {checkin.enableCheckin && (
              <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
                {/* Check-in Methods */}
                <div className="space-y-2">
                  <Label className="text-xs">วิธีเช็คอิน</Label>
                  <div className="flex flex-col gap-2">
                    {(["FACE", "QR", "MANUAL"] as const).map((method) => {
                      const icons = { FACE: ScanFace, QR: QrCode, MANUAL: Keyboard };
                      const Icon = icons[method];
                      return (
                        <label key={method} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={checkin.checkinMethods.includes(method)}
                            onCheckedChange={(checked) => {
                              setCheckin((p) => ({
                                ...p,
                                checkinMethods: checked
                                  ? [...p.checkinMethods, method]
                                  : p.checkinMethods.filter((m) => m !== method) as CheckinMethod[],
                              }));
                            }}
                          />
                          <Icon className="h-3.5 w-3.5" />
                          <span className="text-sm">{CHECKIN_METHOD_LABELS[method]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Timing */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">เปิดเช็คอินก่อนสอบ (นาที)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={120}
                      value={checkin.checkinStartMinutes}
                      onChange={(e) =>
                        setCheckin((p) => ({
                          ...p,
                          checkinStartMinutes: parseInt(e.target.value) || 30,
                        }))
                      }
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">อนุญาตสาย (นาที)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={60}
                      value={checkin.lateCheckinMinutes}
                      onChange={(e) =>
                        setCheckin((p) => ({
                          ...p,
                          lateCheckinMinutes: parseInt(e.target.value) || 15,
                        }))
                      }
                      className="text-sm"
                      disabled={!checkin.allowLateCheckin}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">อนุญาตเช็คอินหลังเวลา</Label>
                  <Switch
                    checked={checkin.allowLateCheckin}
                    onCheckedChange={(v) =>
                      setCheckin((p) => ({ ...p, allowLateCheckin: v }))
                    }
                  />
                </div>

                <Separator className="my-1" />

                {/* Face Verify before exam */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">ยืนยันใบหน้าก่อนสอบ</Label>
                    <p className="text-xs text-muted-foreground">
                      ผู้สอบต้องสแกนใบหน้ายืนยันตัวตนอีกครั้งก่อนเริ่มทำข้อสอบ
                    </p>
                  </div>
                  <Switch
                    checked={checkin.requireFaceVerify}
                    onCheckedChange={(v) =>
                      setCheckin((p) => ({ ...p, requireFaceVerify: v }))
                    }
                  />
                </div>

                {/* IP Restriction Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">จำกัด IP ศูนย์สอบ</Label>
                    <p className="text-xs text-muted-foreground">
                      อนุญาตเฉพาะ IP ที่ตั้งค่าไว้ในศูนย์สอบเท่านั้น
                    </p>
                  </div>
                  <Switch
                    checked={checkin.requireIpCheck}
                    onCheckedChange={(v) =>
                      setCheckin((p) => ({ ...p, requireIpCheck: v }))
                    }
                  />
                </div>
              </div>
            )}
          </div>
          </div>
          )}

          {/* ── Proctoring Settings ── */}
          <Separator className="my-2" />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">การคุมสอบ (Proctoring)</p>
            </div>

            <div className="space-y-3">
                {/* Enable Proctoring */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    เปิดระบบคุมสอบ
                  </Label>
                  <Switch
                    checked={proctoring.enabled}
                    onCheckedChange={(v) => setProctoring((p) => ({ ...p, enabled: v }))}
                  />
                </div>

                {proctoring.enabled && (
                  <>
                    {/* Require Webcam */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        ต้องเปิดกล้อง Webcam
                      </Label>
                      <Switch
                        checked={proctoring.requireWebcam}
                        onCheckedChange={(v) => setProctoring((p) => ({ ...p, requireWebcam: v }))}
                      />
                    </div>

                    {/* Face Detection AI */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm flex items-center gap-2">
                        <ScanFace className="h-4 w-4" />
                        ตรวจจับใบหน้าอัตโนมัติ (AI)
                      </Label>
                      <Switch
                        checked={proctoring.faceDetectionEnabled}
                        onCheckedChange={(v) => setProctoring((p) => ({ ...p, faceDetectionEnabled: v }))}
                        disabled={!proctoring.requireWebcam}
                      />
                    </div>

                    {/* Screenshot Interval */}
                    <div className="flex items-center justify-between gap-4">
                      <Label className="text-sm whitespace-nowrap">ถ่ายภาพทุก (วินาที)</Label>
                      <Input
                        type="number"
                        min={10}
                        max={120}
                        value={proctoring.screenshotInterval}
                        onChange={(e) => setProctoring((p) => ({ ...p, screenshotInterval: parseInt(e.target.value) || 30 }))}
                        className="w-24 text-sm"
                        disabled={!proctoring.requireWebcam}
                      />
                    </div>

                    {/* Screenshot Mode */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label className="text-sm flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          โหมดถ่ายภาพ
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {proctoring.screenshotMode === "periodic"
                            ? "ถ่ายตามเวลาที่กำหนด"
                            : proctoring.screenshotMode === "on_event"
                            ? "ถ่ายเฉพาะเมื่อตรวจพบเสี่ยง"
                            : "ถ่ายทั้งตามเวลา + เมื่อตรวจพบเสี่ยง"}
                        </p>
                      </div>
                      <Select
                        value={proctoring.screenshotMode ?? "both"}
                        onValueChange={(v) => setProctoring((p) => ({ ...p, screenshotMode: v as ScreenshotMode }))}
                        disabled={!proctoring.requireWebcam}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="both">ทั้งสองแบบ</SelectItem>
                          <SelectItem value="periodic">ตามเวลา</SelectItem>
                          <SelectItem value="on_event">เฉพาะเหตุการณ์</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Mode */}
                    <div className="flex items-center justify-between gap-4">
                      <Label className="text-sm flex items-center gap-2">
                        <MonitorSmartphone className="h-4 w-4" />
                        โหมดคุมสอบ
                      </Label>
                      <Select
                        value={proctoring.mode}
                        onValueChange={(v) => setProctoring((p) => ({ ...p, mode: v as ProctoringMode }))}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SCREENSHOT">Screenshot</SelectItem>
                          <SelectItem value="LIVE_VIDEO">Live Video</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Max Violations */}
                    <div className="flex items-center justify-between gap-4">
                      <Label className="text-sm whitespace-nowrap">จำนวนฝ่าฝืนสูงสุด</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={proctoring.maxViolations}
                        onChange={(e) => setProctoring((p) => ({ ...p, maxViolations: parseInt(e.target.value) || 3 }))}
                        className="w-24 text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : isEdit ? (
              "บันทึกการแก้ไข"
            ) : (
              "สร้างรอบสอบ"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
