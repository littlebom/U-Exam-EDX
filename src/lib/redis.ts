import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | null | undefined };

function createRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) return null;

  try {
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    client.on("error", () => {}); // Suppress unhandled error events
    return client;
  } catch {
    return null;
  }
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
