"use client";

import { Calendar, MapPin, Users, Clock, MoreVertical, Pencil, XCircle, Eye, BarChart3, DoorOpen, CalendarClock, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  getSchedulePhase,
  getCountdownText,
  formatScheduleDateRange,
  type SchedulePhaseInfo,
} from "@/lib/schedule-utils";

// ============================================================
// Types
// ============================================================

export interface ScheduleRow {
  id: string;
  examId: string;
  startDate: string;
  endDate: string;
  status: string;
  maxCandidates: number | null;
  location: string | null;
  registrationOpenDate?: string | null;
  registrationDeadline?: string | null;
  testCenterId?: string | null;
  roomId?: string | null;
  exam: { id: string; title: string; status: string };
  testCenter?: { id: string; name: string; code: string } | null;
  room?: { id: string; name: string; code: string; capacity: number | null } | null;
}

interface ScheduleCardProps {
  schedule: ScheduleRow;
  onEdit: (schedule: ScheduleRow) => void;
  onCancel: (schedule: ScheduleRow) => void;
}

// ============================================================
// Phase Badge
// ============================================================

function PhaseBadge({ info }: { info: SchedulePhaseInfo }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        info.color
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          info.dotColor,
          info.animate && "animate-pulse"
        )}
      />
      {info.label}
    </span>
  );
}

// ============================================================
// Component
// ============================================================

export function ScheduleCard({ schedule, onEdit, onCancel }: ScheduleCardProps) {
  const phaseInfo = getSchedulePhase(schedule);
  const countdown = getCountdownText(schedule);
  const dateRange = formatScheduleDateRange(schedule.startDate, schedule.endDate);

  const canEdit = ["OPEN_REG", "CLOSED_REG", "SCHEDULED"].includes(phaseInfo.phase);
  const canCancel = canEdit;
  const showMenu = canEdit || canCancel || phaseInfo.phase === "IN_PROGRESS" || phaseInfo.phase === "COMPLETED";

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        {/* Header: Phase badge + menu */}
        <div className="flex items-start justify-between mb-3">
          <PhaseBadge info={phaseInfo} />
          {showMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 -mt-1 -mr-1">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">เมนู</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit(schedule)} className="gap-2">
                    <Pencil className="h-4 w-4" />
                    แก้ไข
                  </DropdownMenuItem>
                )}
                {phaseInfo.phase === "IN_PROGRESS" && (
                  <DropdownMenuItem className="gap-2">
                    <Eye className="h-4 w-4" />
                    ดูสถานะ
                  </DropdownMenuItem>
                )}
                {phaseInfo.phase === "COMPLETED" && (
                  <DropdownMenuItem className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    ดูผลสอบ
                  </DropdownMenuItem>
                )}
                {canCancel && (
                  <DropdownMenuItem
                    onClick={() => onCancel(schedule)}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <XCircle className="h-4 w-4" />
                    ยกเลิกรอบสอบ
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm mb-3 line-clamp-2">
          {schedule.exam.title}
        </h3>

        {/* Info rows */}
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">{dateRange}</span>
          </div>

          {schedule.testCenter && (
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs truncate">
                {schedule.testCenter.name}
                {schedule.room ? ` — ${schedule.room.name}` : ""}
              </span>
            </div>
          )}

          {schedule.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs truncate">{schedule.location}</span>
            </div>
          )}

          {schedule.maxCandidates && (
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">{schedule.maxCandidates} คน</span>
            </div>
          )}

          {(schedule.registrationOpenDate || schedule.registrationDeadline) && (
            <div className="flex items-center gap-2">
              <CalendarClock className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">
                {schedule.registrationOpenDate && schedule.registrationDeadline ? (
                  <>
                    รับสมัคร{" "}
                    {new Date(schedule.registrationOpenDate).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                    })}
                    {" - "}
                    {new Date(schedule.registrationDeadline).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </>
                ) : schedule.registrationOpenDate ? (
                  <>
                    เปิดรับสมัคร{" "}
                    {new Date(schedule.registrationOpenDate).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </>
                ) : (
                  <>
                    ปิดรับสมัคร{" "}
                    {new Date(schedule.registrationDeadline!).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </>
                )}
              </span>
            </div>
          )}

          {countdown && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-medium">{countdown}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
