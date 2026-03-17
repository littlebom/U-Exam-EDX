import { NextRequest, NextResponse } from "next/server";

/**
 * In-memory sliding window rate limiter.
 * Suitable for single-server deployment (no Redis required).
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 5 });
 *   // In API route:
 *   const result = limiter.check(request);
 *   if (!result.success) return result.response;
 */

interface RateLimitOptions {
  /** Time window in milliseconds (default: 60000 = 1 minute) */
  windowMs?: number;
  /** Max requests per window (default: 10) */
  maxRequests?: number;
  /** Custom key generator (default: IP address) */
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  response?: NextResponse;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

// Cleanup old entries every 5 minutes
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [, store] of stores) {
      for (const [key, entry] of store) {
        if (entry.resetAt < now) {
          store.delete(key);
        }
      }
    }
  }, 5 * 60 * 1000);
  // Don't block process exit
  if (cleanupInterval && typeof cleanupInterval === "object" && "unref" in cleanupInterval) {
    cleanupInterval.unref();
  }
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function createRateLimiter(options: RateLimitOptions = {}) {
  const {
    windowMs = 60_000,
    maxRequests = 10,
    keyGenerator = getClientIp,
  } = options;

  // Create unique store for this limiter instance
  const storeId = `${Date.now()}-${Math.random()}`;
  const store = new Map<string, RateLimitEntry>();
  stores.set(storeId, store);
  ensureCleanup();

  return {
    check(req: NextRequest): RateLimitResult {
      const key = keyGenerator(req);
      const now = Date.now();
      const entry = store.get(key);

      // If no entry or window expired, create new
      if (!entry || entry.resetAt < now) {
        const resetAt = now + windowMs;
        store.set(key, { count: 1, resetAt });
        return {
          success: true,
          remaining: maxRequests - 1,
          limit: maxRequests,
          resetAt: new Date(resetAt),
        };
      }

      // Increment count
      entry.count++;

      if (entry.count > maxRequests) {
        // Rate limited
        const response = NextResponse.json(
          {
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: "คำขอมากเกินไป กรุณาลองใหม่อีกครั้ง",
            },
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)),
              "X-RateLimit-Limit": String(maxRequests),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": new Date(entry.resetAt).toISOString(),
            },
          }
        );

        return {
          success: false,
          remaining: 0,
          limit: maxRequests,
          resetAt: new Date(entry.resetAt),
          response,
        };
      }

      return {
        success: true,
        remaining: maxRequests - entry.count,
        limit: maxRequests,
        resetAt: new Date(entry.resetAt),
      };
    },
  };
}

/**
 * Add rate limit headers to a response
 */
export function withRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", result.resetAt.toISOString());
  return response;
}
