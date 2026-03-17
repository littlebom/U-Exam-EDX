"use server";

import { requirePermission } from "@/lib/rbac";
import { createUser, updateUser, deleteUser } from "@/services/user.service";
import type { ActionResult } from "@/types";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
  roleId: z.string().min(1, "กรุณาเลือก Role"),
  phone: z.string().optional(),
});

export async function createUserAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("user:create");

    const raw = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      roleId: formData.get("roleId"),
      phone: formData.get("phone") || undefined,
    };

    const parsed = createUserSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "form";
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return { success: false, fieldErrors };
    }

    const user = await createUser({
      tenantId: session.tenantId,
      ...parsed.data,
    });

    return { success: true, data: { id: user.id } };
  } catch (error) {
    console.error("Create user error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  roleId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export async function updateUserAction(
  userId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await requirePermission("user:update");

    const raw: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      raw[key] = value || undefined;
    }

    const parsed = updateUserSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "form";
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return { success: false, fieldErrors };
    }

    await updateUser(userId, session.tenantId, parsed.data);
    return { success: true };
  } catch (error) {
    console.error("Update user error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

export async function deleteUserAction(
  userId: string
): Promise<ActionResult> {
  try {
    const session = await requirePermission("user:delete");
    await deleteUser(userId, session.tenantId);
    return { success: true };
  } catch (error) {
    console.error("Delete user error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}
