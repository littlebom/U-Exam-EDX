"use server";

import { requirePermission } from "@/lib/rbac";
import { createRole, updateRolePermissions } from "@/services/role.service";
import type { ActionResult } from "@/types";
import { z } from "zod";

const createRoleSchema = z.object({
  name: z.string().min(2, "ชื่อ Role ต้องมีอย่างน้อย 2 ตัวอักษร"),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).min(1, "กรุณาเลือกสิทธิ์อย่างน้อย 1 รายการ"),
});

export async function createRoleAction(
  data: { name: string; description?: string; permissionIds: string[] }
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("user:roles");

    const parsed = createRoleSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "form";
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return { success: false, fieldErrors };
    }

    const role = await createRole({
      tenantId: session.tenantId,
      ...parsed.data,
    });

    return { success: true, data: { id: role.id } };
  } catch (error) {
    console.error("Create role error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

export async function updateRolePermissionsAction(
  roleId: string,
  permissionIds: string[]
): Promise<ActionResult> {
  try {
    const session = await requirePermission("user:roles");
    await updateRolePermissions(roleId, session.tenantId, permissionIds);
    return { success: true };
  } catch (error) {
    console.error("Update role error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}
