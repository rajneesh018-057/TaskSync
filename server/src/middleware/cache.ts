import { Request, Response, NextFunction } from "express";
import { cacheGet, cacheSet, cacheInvalidatePattern } from "../redis";

/**
 * Cache-Aside Middleware for Express Route Handlers
 * 
 * Inspects Redis for pre-computed responses. If present, serves immediately with 'X-Cache: HIT'.
 * If absent, captures subsequent 'res.json' output, stores it in Redis with specified TTL,
 * and attaches 'X-Cache: MISS'.
 * 
 * @param ttlSeconds Time-to-live in seconds (default: 120s)
 * @param keyGenerator Custom key generation logic (defaults to user ID + path)
 */
export function cacheMiddleware(
  ttlSeconds: number = 120,
  keyGenerator?: (req: Request) => string
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache safe GET / HEAD requests
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }

    const userId = (req as any).user?.id || "anon";
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : `cache:${req.baseUrl || ""}${req.path}:${userId}`;

    try {
      const cachedData = await cacheGet(cacheKey);

      if (cachedData !== null) {
        // Cache HIT!
        res.setHeader("X-Cache", "HIT");
        res.setHeader("X-Cache-Key", cacheKey);
        res.setHeader("X-Cache-TTL", `${ttlSeconds}s`);
        res.json(cachedData);
        return;
      }

      // Cache MISS
      res.setHeader("X-Cache", "MISS");
      res.setHeader("X-Cache-Key", cacheKey);

      // Intercept res.json to capture response payload
      const originalJson = res.json.bind(res);
      res.json = (body: any): Response => {
        // Only cache successful 200 responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheSet(cacheKey, body, ttlSeconds).catch((err) => {
            console.warn(`[Cache Middleware] Failed to cache response for ${cacheKey}:`, err);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.warn(`[Cache Middleware] Cache check failed for ${cacheKey}, bypassing cache:`, err);
      next();
    }
  };
}

/**
 * Invalidate all cached data for a specific user.
 * Triggered on data mutations (POST, PUT, DELETE of tasks, goals, schedule).
 */
export async function invalidateUserCache(userId: string): Promise<number> {
  if (!userId) return 0;
  // Matches all keys tied to this user
  const pattern = `*:${userId}*`;
  const count = await cacheInvalidatePattern(pattern);
  console.log(`[Cache Invalidation] Flushed ${count} cached items for user: ${userId}`);
  return count;
}


export async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<{ data: T; source: "cache" | "database" }> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return { data: cached, source: "cache" };
  }

  const freshData = await fetcher();
  await cacheSet(key, freshData, ttlSeconds);
  return { data: freshData, source: "database" };
}
