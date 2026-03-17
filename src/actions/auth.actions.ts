"use server";

import { signIn } from "@/lib/auth";
import { registerUser } from "@/services/auth.service";
import { registerSchema } from "@/lib/validations/auth";
import type { ActionResult } from "@/types";

export async function registerAction(
  formData: FormData
): Promise<ActionResult<{ userId: string; tenantId: string }>> {
  try {
    const raw = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      tenantName: formData.get("tenantName"),
    };

    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "form";
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return { success: false, fieldErrors };
    }

    const result = await registerUser(parsed.data);

    // Auto sign-in after registration
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Registration error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลงทะเบียน";
    return { success: false, error: message };
  }
}
