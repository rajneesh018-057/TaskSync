import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redisClient, REDIS_KEY_PREFIX } from "../redis";
import { Request, Response } from "express";

/**
 * Creates a rate limit store backed by Redis when connected,
 * or defaults to in-memory store if Redis is unavailable.
 */
function createRateLimitStore(prefix: string) {
  if (redisClient) {
    try {
      return new RedisStore({
        sendCommand: async (...args: string[]) => {
          if (!redisClient) {
            throw new Error("Redis client not initialized");
          }
          const [command, ...cmdArgs] = args;
          return (await redisClient.call(command, ...cmdArgs)) as any;
        },
        prefix: `${REDIS_KEY_PREFIX}rl:${prefix}:`,
      });
    } catch (err) {
      console.warn(`[RateLimit] Failed to attach RedisStore for prefix ${prefix}, using in-memory store.`);
    }
  }
  return undefined; // Falls back to default express-rate-limit MemoryStore
}

/**
 * Helper to identify client identifier (authenticated user ID preferred, otherwise remote IP)
 */
function getClientIdentifier(req: Request): string {
  // If user is authenticated via JWT middleware
  const user = (req as any).user;
  if (user && user.id) {
    return `user:${user.id}`;
  }

  // Account for Nginx reverse proxy headers in Docker
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : forwarded[0];
    return `ip:${ip}`;
  }

  return `ip:${req.ip || req.socket.remoteAddress || "unknown"}`;
}

/**
 * 1. Global API Rate Limiter
 * Standard protection for general endpoints against scraping and DDoS.
 * 200 requests per 15 minutes per IP.
 */
export const generalApiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200,
  standardHeaders: "draft-7", // Returns RateLimit-* headers
  legacyHeaders: false,
  validate: false,
  store: createRateLimitStore("general"),
  keyGenerator: getClientIdentifier,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: "Too Many Requests",
      message: "You have exceeded the global request limit. Please try again later.",
      code: "RATE_LIMIT_GLOBAL_EXCEEDED",
      retryAfterSeconds: Math.ceil((req as any).rateLimit?.resetTime ? ((req as any).rateLimit.resetTime.getTime() - Date.now()) / 1000 : 60),
    });
  },
});

/**
 * 2. Strict Authentication Rate Limiter
 * Protects against credential stuffing and brute-force password cracking on /api/auth/*.
 * 10 attempts per 15 minutes.
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: false,
  store: createRateLimitStore("auth"),
  keyGenerator: (req) => {
    // Key by IP + email if provided in body to prevent targeted attacks
    const email = req.body?.email ? `:${req.body.email.toLowerCase().trim()}` : "";
    return `${getClientIdentifier(req)}${email}`;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: "Too Many Authentication Attempts",
      message: "Too many login/registration attempts detected from this origin. Please wait 15 minutes before retrying.",
      code: "RATE_LIMIT_AUTH_EXCEEDED",
      retryAfterSeconds: Math.ceil((req as any).rateLimit?.resetTime ? ((req as any).rateLimit.resetTime.getTime() - Date.now()) / 1000 : 900),
    });
  },
});

/**
 * 3. AI / Expensive LLM Inference Rate Limiter
 * Protects expensive compute resources (Groq / Gemini AI endpoints) from quota exhaustion and bill spikes.
 * 20 requests per minute per user.
 */
export const aiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: false,
  store: createRateLimitStore("ai"),
  keyGenerator: getClientIdentifier,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: "AI Quota Throttled",
      message: "AI inference request limit reached for this minute (20 req/min). Please pause for a moment to let the model recover.",
      code: "RATE_LIMIT_AI_EXCEEDED",
      retryAfterSeconds: Math.ceil((req as any).rateLimit?.resetTime ? ((req as any).rateLimit.resetTime.getTime() - Date.now()) / 1000 : 60),
    });
  },
});
