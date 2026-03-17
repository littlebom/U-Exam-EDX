"use server";

import { getSessionTenant } from "@/lib/get-session";
import type { ActionResult } from "@/types";
import {
  createRegistrationSchema,
  updateRegistrationSchema,
} from "@/lib/validations/registration";
import {
  createRegistration,
  updateRegistration,
  deleteRegistration,
} from "@/services/registration.service";

export async function createRegistrationAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = createRegistrationSchema.parse(input);
    const registration = await createRegistration(session.tenantId, data);
    return { success: true, data: registration };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function updateRegistrationAction(
  id: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = updateRegistrationSchema.parse(input);
    const registration = await updateRegistration(session.tenantId, id, data);
    return { success: true, data: registration };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function deleteRegistrationAction(
  id: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    await deleteRegistration(session.tenantId, id);
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}
