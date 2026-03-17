"use server";

import { getSessionTenant } from "@/lib/get-session";
import type { ActionResult } from "@/types";
import {
  createCenterStaffSchema,
  updateCenterStaffSchema,
  createStaffShiftSchema,
  updateStaffShiftSchema,
} from "@/lib/validations/center-staff";
import {
  createCenterStaff,
  updateCenterStaff,
  deleteCenterStaff,
  createStaffShift,
  updateStaffShift,
  deleteStaffShift,
} from "@/services/center-staff.service";

// ─── CenterStaff Actions ────────────────────────────────────────────

export async function createCenterStaffAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = createCenterStaffSchema.parse(input);
    const staff = await createCenterStaff(session.tenantId, data);
    return { success: true, data: staff };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function updateCenterStaffAction(
  id: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = updateCenterStaffSchema.parse(input);
    const staff = await updateCenterStaff(session.tenantId, id, data);
    return { success: true, data: staff };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function deleteCenterStaffAction(
  id: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    await deleteCenterStaff(session.tenantId, id);
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

// ─── StaffShift Actions ─────────────────────────────────────────────

export async function createStaffShiftAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = createStaffShiftSchema.parse(input);
    const shift = await createStaffShift(session.tenantId, data);
    return { success: true, data: shift };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function updateStaffShiftAction(
  id: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = updateStaffShiftSchema.parse(input);
    const shift = await updateStaffShift(session.tenantId, id, data);
    return { success: true, data: shift };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function deleteStaffShiftAction(
  id: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    await deleteStaffShift(session.tenantId, id);
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}
