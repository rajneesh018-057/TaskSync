import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./db";
import { getRedisHealth, redisClient } from "./redis";
import { getQueueHealth, closeQueues } from "./queue";
import { generalApiLimiter } from "./middleware/rateLimiter";
import authRoutes from "./routes/auth";
import aiRoutes from "./routes/ai";
import taskRoutes from "./routes/tasks";
import goalRoutes from "./routes/goals";
import scheduleRoutes from "./routes/schedule";
import calendarRoutes from "./routes/calendar";

// Load environment variables (from server folder or workspace root if present)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Trust reverse proxy (Nginx container in Docker Compose)
app.set("trust proxy", 1);

// Middleware
app.use(cors({
  origin: "*", // Adjust in production to frontend url
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Apply Global API Rate Limiter
app.use("/api", generalApiLimiter);

// Mount Modular Routes
app.use("/api/auth", authRoutes);
app.use("/api", aiRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/calendar", calendarRoutes);

/**
 * Enhanced Health Check endpoint
 * Evaluates Express, PostgreSQL (Prisma), and Redis connectivity with latency diagnostics.
 * Crucial for Docker Compose healthcheck probes and Kubernetes readiness/liveness checks.
 */
app.get("/api/health", async (req, res) => {
  const startTime = Date.now();
  const checks: {
    server: string;
    database: { status: "healthy" | "unhealthy"; latencyMs?: number; error?: string };
    redis: { status: "connected" | "disconnected" | "fallback_memory"; latencyMs?: number; url?: string; tls?: boolean; prefix?: string };
    bullmqQueue: { status: "connected" | "disconnected"; waitingJobs?: number; activeJobs?: number; completedJobs?: number; failedJobs?: number };
    uptimeSeconds: number;
    memoryUsageMB: { rss: number; heapUsed: number };
  } = {
    server: "healthy",
    database: { status: "unhealthy" },
    redis: { status: "disconnected" },
    bullmqQueue: { status: "disconnected" },
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMB: {
      rss: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      heapUsed: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
    },
  };

  // 1. Probe Database
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: "healthy",
      latencyMs: Date.now() - dbStart,
    };
  } catch (err: any) {
    checks.database = {
      status: "unhealthy",
      error: err.message || "Database connection error",
    };
  }

  // 2. Probe Redis
  try {
    const redisHealth = await getRedisHealth();
    checks.redis = redisHealth;
  } catch (err: any) {
    checks.redis = {
      status: "disconnected",
    };
  }

  // 3. Probe BullMQ Queue
  try {
    const queueHealth = await getQueueHealth();
    checks.bullmqQueue = queueHealth;
  } catch (err: any) {
    checks.bullmqQueue = {
      status: "disconnected",
    };
  }

  const isHealthy = checks.database.status === "healthy";
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    totalDurationMs: Date.now() - startTime,
    checks,
  });
});

/**
 * Redis & System Metrics endpoint for Backend System Design demonstrations
 */
app.get("/api/system/metrics", async (req, res) => {
  let redisStats: any = { status: "not_connected" };

  if (redisClient) {
    try {
      const info = await redisClient.info("stats");
      const memory = await redisClient.info("memory");
      const dbsize = await redisClient.dbsize();

      // Extract hit/miss metrics from Redis INFO
      const hitsMatch = info.match(/keyspace_hits:(\d+)/);
      const missesMatch = info.match(/keyspace_misses:(\d+)/);
      const memMatch = memory.match(/used_memory_human:(.+)/);

      const hits = hitsMatch ? parseInt(hitsMatch[1], 10) : 0;
      const misses = missesMatch ? parseInt(missesMatch[1], 10) : 0;
      const totalOps = hits + misses;
      const hitRatio = totalOps > 0 ? `${((hits / totalOps) * 100).toFixed(1)}%` : "N/A";

      redisStats = {
        status: "connected",
        totalKeys: dbsize,
        usedMemory: memMatch ? memMatch[1].trim() : "unknown",
        keyspaceHits: hits,
        keyspaceMisses: misses,
        hitRatio,
      };
    } catch (err: any) {
      redisStats = {
        status: "fallback_memory",
        error: err.message,
      };
    }
  }

  res.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    cacheArchitecture: {
      provider: redisClient ? "Redis 7 (Distributed Key-Value Store)" : "In-Memory Fallback",
      cachingPattern: "Cache-Aside (Lazy Loading) with Auto-Invalidation on Write",
      rateLimiter: "Sliding Window / Leaky Bucket (rate-limit-redis)",
    },
    redis: redisStats,
    rateLimitingRules: {
      global: "200 req / 15 min",
      authentication: "10 req / 15 min (Anti Brute-Force)",
      aiInference: "20 req / 1 min (LLM Cost Protection)",
    },
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start Server (only when not running inside Vercel serverless functions)
if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 TaskSync Backend running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📊 System metrics: http://localhost:${PORT}/api/system/metrics`);
    console.log(`⚡ Redis caching & rate limiting active!`);
    console.log(`===============================================`);
  });

  // Graceful Shutdown for DevOps / Docker container termination
  const gracefulShutdown = (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
      console.log("[Server] HTTP server closed.");
      try {
        await closeQueues();
        if (redisClient) {
          await redisClient.quit();
          console.log("[Redis] Connection closed.");
        }
        await prisma.$disconnect();
        console.log("[Prisma] Database connection closed.");
      } catch (err) {
        console.error("[Server] Error during graceful shutdown:", err);
      }
      process.exit(0);
    });

    // Force exit after 10s if hung
    setTimeout(() => {
      console.error("[Server] Forced shutdown timeout exceeded.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

export default app;
