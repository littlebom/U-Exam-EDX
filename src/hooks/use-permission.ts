"use client";

import { useAppSession } from "@/hooks/use-session";

export function usePermission(permission: string): boolean {
  const { role, isAuthenticated } = useAppSession();

  if (!isAuthenticated || !role) return false;
  if (role.name === "PLATFORM_ADMIN" || role.name === "TENANT_OWNER") return true;
  return role.permissions.includes(permission);
}

export function usePermissions(permissions: string[]): boolean {
  const { role, isAuthenticated } = useAppSession();

  if (!isAuthenticated || !role) return false;
  if (role.name === "PLATFORM_ADMIN" || role.name === "TENANT_OWNER") return true;
  return permissions.every((p) => role.permissions.includes(p));
}
