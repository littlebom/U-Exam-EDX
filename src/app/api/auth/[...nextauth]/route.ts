import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";

// Wrap POST to capture IP for audit logging
export const GET = handlers.GET;

export async function POST(req: NextRequest) {
  // Store IP in a header that auth.ts can read later
  // NextAuth doesn't expose request in authorize(), so we store it globally
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;

  if (ip) {
    // Store in global for the current request lifecycle
    (globalThis as Record<string, unknown>).__lastAuthIp = ip;
  }

  return handlers.POST(req);
}
