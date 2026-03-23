import { auth } from "@/lib/auth";
import { errors } from "@/lib/errors";

export interface SessionContext {
  userId: string;
  userName: string;
  tenantId: string;
  tenantName: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

export async function getSessionTenant(): Promise<SessionContext> {
  const session = await auth();

  if (!session?.user?.id) {
    throw errors.unauthorized();
  }

  if (!session.tenant?.id) {
    throw errors.forbidden("ไม่พบข้อมูลองค์กร กรุณาเลือกองค์กร");
  }

  return {
    userId: session.user.id,
    userName: session.user.name ?? "",
    tenantId: session.tenant.id,
    tenantName: session.tenant.name,
    roleId: session.role?.id ?? "",
    roleName: session.role?.name ?? "",
    permissions: session.role?.permissions ?? [],
  };
}
