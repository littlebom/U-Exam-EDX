import { NextRequest } from "next/server";

/**
 * Origin-based CSRF validation for custom API routes.
 *
 * Checks that mutation requests (POST/PUT/DELETE/PATCH) come from
 * the same origin as the application. This prevents cross-site
 * request forgery attacks.
 *
 * Note: Server Actions and NextAuth endpoints have built-in CSRF protection.
 * This is only needed for custom API routes under /api/v1/*.
 */

// Paths exempt from CSRF checking (they use their own auth mechanisms)
const EXEMPT_PREFIXES = [
  "/api/auth/",        // NextAuth — has built-in CSRF
  "/api/webhooks/",    // Webhooks — use HMAC signature
  "/api/v1/external/", // External API — use API key auth
];

/**
 * Check if a request path is exempt from CSRF validation
 */
export function isCsrfExempt(pathname: string): boolean {
  return EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Validate CSRF for a mutation request.
 * Returns true if the request is safe (same-origin), false otherwise.
 */
export function validateCsrf(req: NextRequest): boolean {
  const method = req.method.toUpperCase();

  // Only check mutation methods
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    return true;
  }

  // Check if exempt
  if (isCsrfExempt(req.nextUrl.pathname)) {
    return true;
  }

  // Get allowed origin from environment
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const allowedOrigin = new URL(appUrl).origin;

  // Check Origin header (most reliable)
  const origin = req.headers.get("origin");
  if (origin) {
    return origin === allowedOrigin;
  }

  // Fallback: check Referer header
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      return refererOrigin === allowedOrigin;
    } catch {
      return false;
    }
  }

  // No Origin or Referer header — reject for safety
  // Server-to-server calls should use API key auth (exempt routes)
  return false;
}
