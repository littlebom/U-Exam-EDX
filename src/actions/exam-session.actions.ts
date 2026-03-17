"use server";

import { getSessionTenant } from "@/lib/get-session";
import {
  startSessionSchema,
  submitAnswerSchema,
  flagQuestionSchema,
  autoSaveSchema,
  logEventSchema,
} from "@/lib/validations/exam-session";
import {
  startExam,
  submitAnswer,
  flagQuestion,
  autoSave,
  submitExam,
} from "@/services/exam-session.service";
import { logEvent } from "@/services/anti-cheat.service";
import type { ActionResult } from "@/types";

export async function startExamAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const parsed = startSessionSchema.parse(input);
    const result = await startExam(session.userId, parsed);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

export async function submitAnswerAction(
  sessionId: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const parsed = submitAnswerSchema.parse(input);
    const result = await submitAnswer(sessionId, session.userId, parsed);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

export async function flagQuestionAction(
  sessionId: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const parsed = flagQuestionSchema.parse(input);
    const result = await flagQuestion(sessionId, session.userId, parsed);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

export async function autoSaveAction(
  sessionId: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const parsed = autoSaveSchema.parse(input);
    const result = await autoSave(sessionId, session.userId, parsed);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

export async function submitExamAction(
  sessionId: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const result = await submitExam(sessionId, session.userId);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

export async function logEventAction(
  sessionId: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const parsed = logEventSchema.parse(input);
    const result = await logEvent(sessionId, session.userId, parsed);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}
