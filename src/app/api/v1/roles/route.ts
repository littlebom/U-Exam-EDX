import { NextResponse } from "next/server";
import { getSessionTenant } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await getSessionTenant();

    const roles = await prisma.role.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        isSystem: true,
        rolePermissions: {
          select: { permissionId: true },
        },
        _count: {
          select: { userTenants: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    return handleApiError(error);
  }
}
