import { NextResponse } from "next/server";
import { getSessionTenant } from "@/lib/get-session";
import { listPermissions } from "@/services/role.service";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    await getSessionTenant(); // Auth check

    const permissions = await listPermissions();

    // Group permissions by module
    const grouped: Record<string, typeof permissions> = {};
    for (const perm of permissions) {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    }

    return NextResponse.json({ success: true, data: { permissions, grouped } });
  } catch (error) {
    return handleApiError(error);
  }
}
