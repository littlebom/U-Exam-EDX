/**
 * Schedule phase computation utility
 *
 * คำนวณ display phase ของรอบสอบจาก timestamps + DB status
 */

export type SchedulePhase =
  | "CANCELLED"
  | "COMPLETED"
  | "IN_PROGRESS"
  | "CLOSED_REG"
  | "OPEN_REG"
  | "SCHEDULED";

export interface SchedulePhaseInfo {
  phase: SchedulePhase;
  label: string;
  color: string;
  dotColor: string;
  animate?: boolean;
}

interface ScheduleForPhase {
  status: string;
  startDate: string | Date;
  endDate: string | Date;
  registrationOpenDate?: string | Date | null;
  registrationDeadline?: string | Date | null;
}

const PHASE_MAP: Record<SchedulePhase, Omit<SchedulePhaseInfo, "phase">> = {
  CANCELLED: {
    label: "ยกเลิก",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    dotColor: "bg-red-500",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    dotColor: "bg-gray-400",
  },
  IN_PROGRESS: {
    label: "กำลังสอบ",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    dotColor: "bg-green-500",
    animate: true,
  },
  CLOSED_REG: {
    label: "ปิดรับสมัคร",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    dotColor: "bg-yellow-500",
  },
  OPEN_REG: {
    label: "เปิดรับสมัคร",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    dotColor: "bg-blue-500",
  },
  SCHEDULED: {
    label: "รอดำเนินการ",
    color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    dotColor: "bg-slate-400",
  },
};

export function getSchedulePhase(schedule: ScheduleForPhase): SchedulePhaseInfo {
  const now = new Date();
  const startDate = new Date(schedule.startDate);
  const endDate = new Date(schedule.endDate);
  const regOpenDate = schedule.registrationOpenDate
    ? new Date(schedule.registrationOpenDate)
    : null;
  const regDeadline = schedule.registrationDeadline
    ? new Date(schedule.registrationDeadline)
    : null;

  let phase: SchedulePhase;

  if (schedule.status === "CANCELLED") {
    phase = "CANCELLED";
  } else if (schedule.status === "COMPLETED" || now > endDate) {
    phase = "COMPLETED";
  } else if (now >= startDate && now <= endDate) {
    phase = "IN_PROGRESS";
  } else if (regDeadline && now > regDeadline && now < startDate) {
    phase = "CLOSED_REG";
  } else if (regOpenDate && now < regOpenDate) {
    // ยังไม่ถึงวันเปิดรับสมัคร
    phase = "SCHEDULED";
  } else if (now < startDate && (!regDeadline || now <= regDeadline)) {
    phase = "OPEN_REG";
  } else {
    phase = "SCHEDULED";
  }

  return { phase, ...PHASE_MAP[phase] };
}

/**
 * คำนวณ countdown text (เช่น "เริ่มใน 3 วัน", "เหลือ 2 ชั่วโมง")
 */
export function getCountdownText(schedule: ScheduleForPhase): string | null {
  const now = new Date();
  const startDate = new Date(schedule.startDate);
  const endDate = new Date(schedule.endDate);

  if (schedule.status === "CANCELLED") return null;

  if (now > endDate || schedule.status === "COMPLETED") {
    return "สอบเสร็จแล้ว";
  }

  if (now >= startDate && now <= endDate) {
    const remainMs = endDate.getTime() - now.getTime();
    return `เหลือ ${formatDuration(remainMs)}`;
  }

  // Before start
  const untilStart = startDate.getTime() - now.getTime();
  return `เริ่มใน ${formatDuration(untilStart)}`;
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays > 0) {
    return `${totalDays} วัน`;
  }
  if (totalHours > 0) {
    const remainMinutes = totalMinutes % 60;
    return remainMinutes > 0
      ? `${totalHours} ชม. ${remainMinutes} นาที`
      : `${totalHours} ชั่วโมง`;
  }
  return `${totalMinutes} นาที`;
}

/**
 * Format date range in Thai locale
 */
export function formatScheduleDateRange(
  startDate: string | Date,
  endDate: string | Date
): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const dateOpts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };

  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };

  const startDateStr = start.toLocaleDateString("th-TH", dateOpts);
  const startTimeStr = start.toLocaleTimeString("th-TH", timeOpts);
  const endTimeStr = end.toLocaleTimeString("th-TH", timeOpts);

  // Same day
  if (start.toDateString() === end.toDateString()) {
    return `${startDateStr} ${startTimeStr} - ${endTimeStr}`;
  }

  const endDateStr = end.toLocaleDateString("th-TH", dateOpts);
  return `${startDateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr}`;
}
