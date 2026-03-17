"use server";

import { getSessionTenant } from "@/lib/get-session";
import type { ActionResult } from "@/types";
import {
  createVoucherSchema,
  promoteWaitingListSchema,
} from "@/lib/validations/voucher";
import { createVoucher, cancelVoucher, useVoucher, bulkGenerateVouchers } from "@/services/voucher.service";
import {
  promoteFromWaitingList,
  cancelRegistrationWithPromotion,
  rescheduleRegistration,
} from "@/services/waiting-list.service";

// ─── Voucher Actions ────────────────────────────────────────────────

export async function createVoucherAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = createVoucherSchema.parse(input);
    const voucher = await createVoucher(session.tenantId, data);
    return { success: true, data: voucher };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function cancelVoucherAction(
  id: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const voucher = await cancelVoucher(session.tenantId, id);
    return { success: true, data: voucher };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function useVoucherAction(
  id: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const voucher = await useVoucher(session.tenantId, id);
    return { success: true, data: voucher };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function bulkGenerateVouchersAction(
  examScheduleId: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const result = await bulkGenerateVouchers(session.tenantId, examScheduleId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

// ─── Waiting List Actions ───────────────────────────────────────────

export async function promoteWaitingListAction(
  examScheduleId: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const result = await promoteFromWaitingList(session.tenantId, examScheduleId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function cancelWithPromotionAction(
  registrationId: string,
  reason?: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const result = await cancelRegistrationWithPromotion(session.tenantId, registrationId, reason);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function rescheduleRegistrationAction(
  registrationId: string,
  newExamScheduleId: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const result = await rescheduleRegistration(session.tenantId, registrationId, newExamScheduleId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}
