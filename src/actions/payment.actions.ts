"use server";

import { getSessionTenant } from "@/lib/get-session";
import type { ActionResult } from "@/types";
import {
  createPaymentSchema,
  processPaymentSchema,
  createRefundSchema,
  processRefundSchema,
  createCouponSchema,
  updateCouponSchema,
  applyCouponSchema,
} from "@/lib/validations/payment";
import {
  createPayment,
  processPayment,
} from "@/services/payment.service";
import { createRefund, processRefund } from "@/services/refund.service";
import {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
} from "@/services/coupon.service";

// ─── Payment Actions ────────────────────────────────────────────────

export async function createPaymentAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = createPaymentSchema.parse(input);
    const payment = await createPayment(session.tenantId, data);
    return { success: true, data: payment };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

export async function processPaymentAction(
  id: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = processPaymentSchema.parse(input);
    const payment = await processPayment(session.tenantId, id, data);
    return { success: true, data: payment };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

// ─── Refund Actions ─────────────────────────────────────────────────

export async function createRefundAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = createRefundSchema.parse(input);
    const refund = await createRefund(session.tenantId, data);
    return { success: true, data: refund };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

export async function processRefundAction(
  refundId: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const { status } = processRefundSchema.parse(input);
    const refund = await processRefund(
      session.tenantId,
      refundId,
      status,
      session.userId
    );
    return { success: true, data: refund };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

// ─── Coupon Actions ─────────────────────────────────────────────────

export async function createCouponAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = createCouponSchema.parse(input);
    const coupon = await createCoupon(session.tenantId, data);
    return { success: true, data: coupon };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

export async function updateCouponAction(
  id: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = updateCouponSchema.parse(input);
    const coupon = await updateCoupon(session.tenantId, id, data);
    return { success: true, data: coupon };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

export async function deleteCouponAction(
  id: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    await deleteCoupon(session.tenantId, id);
    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

export async function applyCouponAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = applyCouponSchema.parse(input);
    const result = await applyCoupon(session.tenantId, data);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}
