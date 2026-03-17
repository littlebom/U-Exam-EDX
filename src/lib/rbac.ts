import { getSessionTenant, type SessionContext } from "@/lib/get-session";
import { errors } from "@/lib/errors";

export function hasPermission(
  session: SessionContext,
  permission: string
): boolean {
  if (session.roleName === "PLATFORM_ADMIN" || session.roleName === "TENANT_OWNER") return true;
  return session.permissions.includes(permission);
}

export async function requirePermission(
  permission: string
): Promise<SessionContext> {
  const session = await getSessionTenant();

  if (!hasPermission(session, permission)) {
    throw errors.forbidden(`ไม่มีสิทธิ์: ${permission}`);
  }

  return session;
}
