import { redis } from "./redis";

/**
 * Cache wrapper — returns cached data if available, otherwise runs fn() and caches the result.
 * Falls back to running fn() directly if Redis is unavailable.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  if (!redis) return fn();

  try {
    await redis.connect().catch(() => {});
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch {
    // Redis unavailable — fall through to fn()
  }

  const result = await fn();

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(result));
  } catch {
    // Ignore cache write failures
  }

  return result;
}
