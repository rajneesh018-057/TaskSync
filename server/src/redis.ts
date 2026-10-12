import Redis, { Redis as RedisType } from "ioredis";
import fs from "fs";

/**
 * Key prefix for Redis key isolation (prevents collisions when sharing Redis on 6379 or multi-tenant)
 */
export const REDIS_KEY_PREFIX = process.env.REDIS_KEY_PREFIX || "tasksync:";

/**
 * Helper to prefix a Redis key with the application namespace
 */
export function prefixKey(key: string): string {
  if (key.startsWith(REDIS_KEY_PREFIX)) {
    return key;
  }
  return `${REDIS_KEY_PREFIX}${key}`;
}

/**
 * Resolves Redis connection options supporting:
 * - Local Redis (port 6379)
 * - Docker Desktop standalone container (host.docker.internal:6379)
 * - Docker Compose Redis (redis://redis:6379)
 * - Upstash Redis (rediss://... or UPSTASH_REDIS_REST_URL + token)
 */
export function resolveRedisConfig(): {
  url: string;
  maskedUrl: string;
  isTls: boolean;
  prefix: string;
} {
  let rawUrl = process.env.REDIS_URL;

  // 1. If Upstash REST credentials are provided and REDIS_URL is not set, convert to Redis TLS URL
  if (!rawUrl && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const host = process.env.UPSTASH_REDIS_REST_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    rawUrl = `rediss://default:${token}@${host}:6379`;
  }

  // 2. Default to port 6379 (or configurable REDIS_HOST_PORT)
  if (!rawUrl) {
    const hostPort = process.env.REDIS_HOST_PORT || "6379";
    // In Docker Desktop standalone containers, 'localhost' refers to the container itself.
    // 'host.docker.internal' connects directly to Redis running on the host machine.
    const isDocker = fs.existsSync("/.dockerenv");
    const defaultHost = isDocker ? "host.docker.internal" : "localhost";
    rawUrl = `redis://${defaultHost}:${hostPort}`;
  }

  const isTls = rawUrl.startsWith("rediss://") || rawUrl.includes("upstash.io");

  // Mask password for safe logging & healthcheck diagnostics
  let maskedUrl = rawUrl;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.password) {
      parsed.password = "******";
      maskedUrl = parsed.toString();
    }
  } catch {
    maskedUrl = rawUrl.replace(/:[^:@]+@/, ":******@");
  }

  return {
    url: rawUrl,
    maskedUrl,
    isTls,
    prefix: REDIS_KEY_PREFIX,
  };
}

const { url: REDIS_URL, maskedUrl: MASKED_REDIS_URL, isTls: IS_TLS_REDIS } = resolveRedisConfig();

let isRedisConnected = false;
let redisClient: RedisType | null = null;

// In-memory fallback cache when Redis is temporarily unavailable or in local dev without Redis
const inMemoryCache = new Map<string, { value: any; expiry: number | null }>();

try {
  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    tls: IS_TLS_REDIS ? { rejectUnauthorized: false } : undefined,
    retryStrategy(times) {
      if (times > 5) {
        console.warn("[Redis] Exceeded max reconnect attempts (5). Running with in-memory fallback.");
        return null; // Stop retrying automatically to avoid log spam
      }
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
    reconnectOnError(err) {
      const targetError = "READONLY";
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
    lazyConnect: false,
    enableReadyCheck: true,
  });

  redisClient.on("connect", () => {
    console.log(`[Redis] Connecting to ${MASKED_REDIS_URL} (TLS: ${IS_TLS_REDIS ? "enabled" : "disabled"}, Prefix: "${REDIS_KEY_PREFIX}")...`);
  });

  redisClient.on("ready", () => {
    isRedisConnected = true;
    console.log(`[Redis] ✅ Connection established and ready to accept commands!`);
  });

  redisClient.on("error", (err: any) => {
    // Only warn to prevent crashing the Express process
    isRedisConnected = false;
    const errorMsg = err.message || (err.errors ? err.errors.map((e: any) => e.message || e.code).join(", ") : err.code || "Connection failed");
    console.warn(`[Redis] ⚠️ Connection issue (${errorMsg}). Using graceful fallback.`);
  });

  redisClient.on("close", () => {
    isRedisConnected = false;
  });
} catch (error) {
  console.warn("[Redis] Failed to initialize Redis client. Falling back to in-memory store.", error);
  redisClient = null;
  isRedisConnected = false;
}

/**
 * Checks whether Redis is currently healthy and responsive
 */
export async function getRedisHealth(): Promise<{
  status: "connected" | "disconnected" | "fallback_memory";
  latencyMs?: number;
  url: string;
  tls: boolean;
  prefix: string;
}> {
  if (!redisClient || !isRedisConnected) {
    return {
      status: "fallback_memory",
      url: MASKED_REDIS_URL,
      tls: IS_TLS_REDIS,
      prefix: REDIS_KEY_PREFIX,
    };
  }

  const start = Date.now();
  try {
    const pingRes = await redisClient.ping();
    const latencyMs = Date.now() - start;
    if (pingRes === "PONG") {
      return { status: "connected", latencyMs, url: MASKED_REDIS_URL, tls: IS_TLS_REDIS, prefix: REDIS_KEY_PREFIX };
    }
    return { status: "disconnected", latencyMs, url: MASKED_REDIS_URL, tls: IS_TLS_REDIS, prefix: REDIS_KEY_PREFIX };
  } catch {
    return { status: "fallback_memory", url: MASKED_REDIS_URL, tls: IS_TLS_REDIS, prefix: REDIS_KEY_PREFIX };
  }
}

/**
 * Cache Get - Retrieves and parses JSON data from Redis or fallback memory
 */
export async function cacheGet<T = any>(key: string): Promise<T | null> {
  const fullKey = prefixKey(key);
  try {
    if (isRedisConnected && redisClient) {
      const data = await redisClient.get(fullKey);
      if (!data) return null;
      return JSON.parse(data) as T;
    }
  } catch (error) {
    console.warn(`[Redis Cache] GET error for key ${fullKey}:`, error);
  }

  // Fallback to in-memory cache
  const cached = inMemoryCache.get(fullKey);
  if (!cached) return null;
  if (cached.expiry && cached.expiry < Date.now()) {
    inMemoryCache.delete(fullKey);
    return null;
  }
  return cached.value as T;
}

/**
 * Cache Set - Serializes and stores data in Redis or fallback memory with TTL
 * @param key Cache key
 * @param data JSON-serializable data
 * @param ttlSeconds Expiration in seconds (default 300s / 5 minutes)
 */
export async function cacheSet(
  key: string,
  data: any,
  ttlSeconds: number = 300
): Promise<boolean> {
  const fullKey = prefixKey(key);
  try {
    const serialized = JSON.stringify(data);
    if (isRedisConnected && redisClient) {
      if (ttlSeconds > 0) {
        await redisClient.set(fullKey, serialized, "EX", ttlSeconds);
      } else {
        await redisClient.set(fullKey, serialized);
      }
      return true;
    }
  } catch (error) {
    console.warn(`[Redis Cache] SET error for key ${fullKey}:`, error);
  }

  // Fallback in-memory cache
  const expiry = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
  inMemoryCache.set(fullKey, { value: data, expiry });
  return true;
}

/**
 * Cache Del - Deletes a specific key
 */
export async function cacheDel(key: string): Promise<boolean> {
  const fullKey = prefixKey(key);
  try {
    if (isRedisConnected && redisClient) {
      await redisClient.del(fullKey);
    }
  } catch (error) {
    console.warn(`[Redis Cache] DEL error for key ${fullKey}:`, error);
  }

  inMemoryCache.delete(fullKey);
  return true;
}

/**
 * Cache Invalidate Pattern - Safely invalidates keys matching a glob pattern using SCAN
 */
export async function cacheInvalidatePattern(pattern: string): Promise<number> {
  let invalidatedCount = 0;
  const fullPattern = prefixKey(pattern);

  try {
    if (isRedisConnected && redisClient) {
      let cursor = "0";
      do {
        // SCAN with count 100 to avoid blocking the single-threaded Redis event loop
        const [nextCursor, keys] = await redisClient.scan(cursor, "MATCH", fullPattern, "COUNT", 100);
        cursor = nextCursor;

        if (keys.length > 0) {
          await redisClient.del(...keys);
          invalidatedCount += keys.length;
        }
      } while (cursor !== "0");
    }
  } catch (error) {
    console.warn(`[Redis Cache] SCAN/DEL pattern error for ${fullPattern}:`, error);
  }

  // Invalidate in-memory fallback matching regex
  const regex = new RegExp(`^${fullPattern.replace(/\*/g, ".*")}$`);
  for (const key of inMemoryCache.keys()) {
    if (regex.test(key)) {
      inMemoryCache.delete(key);
      invalidatedCount++;
    }
  }

  return invalidatedCount;
}

export { redisClient, isRedisConnected };
export default redisClient;
