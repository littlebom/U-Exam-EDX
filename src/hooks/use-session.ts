"use client";

import { useSession as useNextAuthSession } from "next-auth/react";
import type { Session } from "next-auth";

export function useAppSession() {
  const { data: session, status, update } = useNextAuthSession();

  return {
    session: session as Session | null,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    user: session?.user ?? null,
    tenant: session?.tenant ?? null,
    role: session?.role ?? null,
    permissions: session?.role?.permissions ?? [],
    update,
  };
}
