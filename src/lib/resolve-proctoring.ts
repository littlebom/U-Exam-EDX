import { type ProctoringSettings, DEFAULT_PROCTORING_SETTINGS } from "@/lib/validations/proctoring";

/**
 * Resolve proctoring settings from ExamSchedule settings.
 * Proctoring is configured per-schedule (not per-exam).
 */
export function resolveProctoringSettings(
  scheduleSettings: Record<string, unknown> | null
): ProctoringSettings {
  const proctoringRaw = scheduleSettings?.proctoring as Partial<ProctoringSettings> | null | undefined;
  if (proctoringRaw && typeof proctoringRaw === "object") {
    return { ...DEFAULT_PROCTORING_SETTINGS, ...proctoringRaw };
  }

  return DEFAULT_PROCTORING_SETTINGS;
}
