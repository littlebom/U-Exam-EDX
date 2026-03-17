"use server";

import { getSessionTenant } from "@/lib/get-session";
import type { ActionResult } from "@/types";
import {
  createSeatSchema,
  updateSeatSchema,
  bulkCreateSeatsSchema,
  createEquipmentSchema,
  updateEquipmentSchema,
} from "@/lib/validations/seat-equipment";
import {
  createSeat,
  updateSeat,
  deleteSeat,
  bulkCreateSeats,
  bulkUpdateSeatStatus,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from "@/services/seat-equipment.service";

// ─── Seat Actions ───────────────────────────────────────────────────

export async function createSeatAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = createSeatSchema.parse(input);
    const seat = await createSeat(session.tenantId, data);
    return { success: true, data: seat };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function bulkCreateSeatsAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = bulkCreateSeatsSchema.parse(input);
    const result = await bulkCreateSeats(session.tenantId, data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function updateSeatAction(
  id: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = updateSeatSchema.parse(input);
    const seat = await updateSeat(session.tenantId, id, data);
    return { success: true, data: seat };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function bulkUpdateSeatStatusAction(
  roomId: string,
  seatIds: string[],
  status: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const result = await bulkUpdateSeatStatus(session.tenantId, roomId, seatIds, status);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function deleteSeatAction(
  id: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    await deleteSeat(session.tenantId, id);
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

// ─── Equipment Actions ──────────────────────────────────────────────

export async function createEquipmentAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = createEquipmentSchema.parse(input);
    const equipment = await createEquipment(session.tenantId, data);
    return { success: true, data: equipment };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function updateEquipmentAction(
  id: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = updateEquipmentSchema.parse(input);
    const equipment = await updateEquipment(session.tenantId, id, data);
    return { success: true, data: equipment };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function deleteEquipmentAction(
  id: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    await deleteEquipment(session.tenantId, id);
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}
