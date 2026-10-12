import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";
import { resolveRedisConfig, REDIS_KEY_PREFIX } from "./redis";

const { url: REDIS_URL, maskedUrl, isTls } = resolveRedisConfig();

// Clean prefix without trailing colon for BullMQ namespace isolation
const queuePrefix = `{${REDIS_KEY_PREFIX.replace(/:+$/, "") || "tasksync"}}`;

// BullMQ requires maxRetriesPerRequest: null on Redis connections
let bullRedisConnection: Redis | null = null;
let isBullConnected = false;

try {
  bullRedisConnection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: isTls ? { rejectUnauthorized: false } : undefined,
    retryStrategy(times) {
      if (times > 10) return null;
      return Math.min(times * 200, 3000);
    },
  });

  bullRedisConnection.on("ready", () => {
    isBullConnected = true;
    console.log(`[BullMQ] ✅ Connected to Redis (${maskedUrl}) with queue prefix ${queuePrefix}!`);
  });

  bullRedisConnection.on("error", (err: any) => {
    isBullConnected = false;
    const errorMsg = err.message || (err.errors ? err.errors.map((e: any) => e.message || e.code).join(", ") : err.code || "Connection failed");
    console.warn(`[BullMQ] ⚠️ Connection issue (${errorMsg}). Queue operations will be deferred.`);
  });
} catch (err: any) {
  console.warn("[BullMQ] Failed to initialize Redis connection for queues:", err.message);
  bullRedisConnection = null;
}

export interface TaskJobData {
  type: "sync_calendar" | "send_notification" | "ai_insights_precompute" | "cleanup_stale_cache";
  userId?: string;
  payload?: any;
  createdAt: string;
}

// 1. Task Queue initialization
export const taskSyncQueue = bullRedisConnection
  ? new Queue<TaskJobData>("tasksync-jobs", {
      connection: bullRedisConnection,
      prefix: queuePrefix,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    })
  : null;

if (taskSyncQueue) {
  taskSyncQueue.on("error", () => {
    isBullConnected = false;
    // Suppress unhandled event error when Redis is disconnected
  });
}

// 2. Background Worker processor
export const taskWorker = bullRedisConnection
  ? new Worker<TaskJobData>(
      "tasksync-jobs",
      async (job: Job<TaskJobData>) => {
        console.log(`[BullMQ Worker] ⚙️ Processing job ${job.id} of type: ${job.data.type}`);
        
        switch (job.data.type) {
          case "sync_calendar":
            console.log(`[BullMQ Worker] Synchronizing Google Calendar events for user: ${job.data.userId}`);
            break;
          case "cleanup_stale_cache":
            console.log(`[BullMQ Worker] Running background cache cleanup routine`);
            break;
          case "ai_insights_precompute":
            console.log(`[BullMQ Worker] Precomputing AI cognitive workload for user: ${job.data.userId}`);
            break;
          case "send_notification":
            console.log(`[BullMQ Worker] Dispatching reminder notification:`, job.data.payload);
            break;
          default:
            console.log(`[BullMQ Worker] Unknown job type received: ${job.data.type}`);
        }

        return { status: "completed", processedAt: new Date().toISOString() };
      },
      {
        connection: bullRedisConnection,
        prefix: queuePrefix,
        concurrency: 5,
      }
    )
  : null;

if (taskWorker) {
  taskWorker.on("error", () => {
    isBullConnected = false;
    // Suppress unhandled event error when Redis is disconnected
  });

  taskWorker.on("completed", (job) => {
    console.log(`[BullMQ Worker] ✅ Job ${job.id} completed successfully`);
  });

  taskWorker.on("failed", (job, err) => {
    console.error(`[BullMQ Worker] ❌ Job ${job?.id} failed:`, err.message);
  });
}

/**
 * Returns health metrics for BullMQ
 */
export async function getQueueHealth(): Promise<{
  status: "connected" | "disconnected";
  waitingJobs?: number;
  activeJobs?: number;
  completedJobs?: number;
  failedJobs?: number;
}> {
  if (!taskSyncQueue || !isBullConnected) {
    return { status: "disconnected" };
  }

  try {
    const [waiting, active, completed, failed] = await Promise.all([
      taskSyncQueue.getWaitingCount(),
      taskSyncQueue.getActiveCount(),
      taskSyncQueue.getCompletedCount(),
      taskSyncQueue.getFailedCount(),
    ]);

    return {
      status: "connected",
      waitingJobs: waiting,
      activeJobs: active,
      completedJobs: completed,
      failedJobs: failed,
    };
  } catch (err) {
    return { status: "disconnected" };
  }
}

/**
 * Graceful BullMQ shutdown
 */
export async function closeQueues(): Promise<void> {
  try {
    if (taskWorker) await taskWorker.close();
    if (taskSyncQueue) await taskSyncQueue.close();
    if (bullRedisConnection) await bullRedisConnection.quit();
    console.log("[BullMQ] Worker and Queues closed cleanly.");
  } catch (err) {
    console.error("[BullMQ] Error closing queue connection:", err);
  }
}
