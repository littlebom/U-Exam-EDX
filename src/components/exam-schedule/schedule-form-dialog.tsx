"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const [examId, setExamId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [maxCandidates, setMaxCandidates] = useState("");
  const [registrationOpenDate, setRegistrationOpenDate] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [testCenterId, setTestCenterId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Load exams for select
  const { data: exams } = useSimpleList<ExamOption>("exams", "/api/v1/exams");

  // Load test centers
  const { data: testCenters } = useSimpleList<TestCenterOption>(
    "test-centers",
    "/api/v1/test-centers?perPage=100"
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
      } else {
        setExamId("");
        setStartDate("");
        setEndDate("");
        setLocation("");
        setMaxCandidates("");
        setRegistrationOpenDate("");
        setRegistrationDeadline("");
        setTestCenterId("");
        setRoomId("");
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
      const payload = {
        ...(isEdit ? {} : { examId }),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        location: location || null,
        maxCandidates: maxCandidates ? parseInt(maxCandidates) : null,
        registrationOpenDate: registrationOpenDate
          ? new Date(registrationOpenDate).toISOString()
          : null,
        registrationDeadline: registrationDeadline
          ? new Date(registrationDeadline).toISOString()
          : null,
        testCenterId: testCenterId || null,
        roomId: roomId || null,
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

          {/* Test Center & Room Section */}
          <div className="space-y-1">
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

          {/* Location (free text) */}
          <div className="space-y-2">
            <Label>สถานที่เพิ่มเติม</Label>
            <Input
              placeholder="เช่น ชั้น 3 อาคาร A"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Max Candidates */}
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
