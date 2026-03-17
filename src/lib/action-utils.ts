import type { ZodError } from "zod";
import type { ActionResult } from "@/types";

/**
 * Format Zod validation errors into field-level error map.
 */
export function formatZodErrors<T = void>(error: ZodError): ActionResult<T> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path[0]?.toString() ?? "form";
    if (!fieldErrors[field]) fieldErrors[field] = [];
    fieldErrors[field].push(issue.message);
  }
  return { success: false, fieldErrors };
}

/**
 * Wrap a server action's catch block with consistent error handling.
 */
export function handleActionError<T = void>(error: unknown): ActionResult<T> {
  const message =
    error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
  return { success: false, error: message };
}
