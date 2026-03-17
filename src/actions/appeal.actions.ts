"use server";

import { getSessionTenant } from "@/lib/get-session";
import {
  createAppealSchema,
  resolveAppealSchema,
} from "@/lib/validations/grading";
import {
  createAppeal,
  resolveAppeal,
} from "@/services/appeal.service";
import type { ActionResult } from "@/types";

// ─── Create Appeal (candidate) ──────────────────────────────────────

export async function createAppealAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const parsed = createAppealSchema.parse(input);
    const result = await createAppeal(session.tenantId, session.userId, parsed);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

// ─── Resolve Appeal (admin/grader) ──────────────────────────────────

export async function resolveAppealAction(
  appealId: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const parsed = resolveAppealSchema.parse(input);
    const result = await resolveAppeal(session.tenantId, appealId, session.userId, parsed);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}
