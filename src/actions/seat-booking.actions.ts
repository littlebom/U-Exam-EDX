"use server";

import { getSessionTenant } from "@/lib/get-session";
import type { ActionResult } from "@/types";
import {
  bookSeatSchema,
  releaseSeatSchema,
  swapSeatsSchema,
  autoAssignSeatsSchema,
} from "@/lib/validations/seat-booking";
import {
  bookSeat,
  releaseSeat,
  swapSeats,
  autoAssignSeats,
} from "@/services/seat-booking.service";

// ─── Seat Booking Actions ───────────────────────────────────────────

export async function bookSeatAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = bookSeatSchema.parse(input);
    const result = await bookSeat(session.tenantId, data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function releaseSeatAction(
  registrationId: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = releaseSeatSchema.parse({ registrationId });
    const result = await releaseSeat(session.tenantId, data.registrationId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function swapSeatsAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = swapSeatsSchema.parse(input);
    const result = await swapSeats(session.tenantId, data.registrationId1, data.registrationId2);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function autoAssignSeatsAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = autoAssignSeatsSchema.parse(input);
    const result = await autoAssignSeats(session.tenantId, data.examScheduleId, data.roomId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}
