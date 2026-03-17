"use server";

import { getSessionTenant } from "@/lib/get-session";
import type { ActionResult } from "@/types";
import {
  createTestCenterSchema,
  updateTestCenterSchema,
  createBuildingSchema,
  updateBuildingSchema,
  createRoomSchema,
  updateRoomSchema,
} from "@/lib/validations/test-center";
import {
  createTestCenter,
  updateTestCenter,
  deleteTestCenter,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  createRoom,
  updateRoom,
  deleteRoom,
} from "@/services/test-center.service";

// ─── TestCenter Actions ─────────────────────────────────────────────

export async function createTestCenterAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = createTestCenterSchema.parse(input);
    const center = await createTestCenter(session.tenantId, data);
    return { success: true, data: center };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function updateTestCenterAction(
  id: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = updateTestCenterSchema.parse(input);
    const center = await updateTestCenter(session.tenantId, id, data);
    return { success: true, data: center };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function deleteTestCenterAction(
  id: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    await deleteTestCenter(session.tenantId, id);
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

// ─── Building Actions ───────────────────────────────────────────────

export async function createBuildingAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = createBuildingSchema.parse(input);
    const building = await createBuilding(session.tenantId, data);
    return { success: true, data: building };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function updateBuildingAction(
  id: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = updateBuildingSchema.parse(input);
    const building = await updateBuilding(session.tenantId, id, data);
    return { success: true, data: building };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function deleteBuildingAction(
  id: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    await deleteBuilding(session.tenantId, id);
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

// ─── Room Actions ───────────────────────────────────────────────────

export async function createRoomAction(
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = createRoomSchema.parse(input);
    const room = await createRoom(session.tenantId, data);
    return { success: true, data: room };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function updateRoomAction(
  id: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    const data = updateRoomSchema.parse(input);
    const room = await updateRoom(session.tenantId, id, data);
    return { success: true, data: room };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}

export async function deleteRoomAction(
  id: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await getSessionTenant();
    await deleteRoom(session.tenantId, id);
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" };
  }
}
