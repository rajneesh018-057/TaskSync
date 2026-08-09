import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = createClient({
  url: REDIS_URL,
});

let isRedisConnected = false;

redisClient.on("error", (err) => {
  // Only log if we are trying to do something and it's failing to avoid spamming the console
  // console.warn("[Redis] Connection Error:", err.message);
});

redisClient.on("connect", () => {
  console.log("[Redis] Connected successfully.");
  isRedisConnected = true;
});

redisClient.on("end", () => {
  isRedisConnected = false;
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err: any) {
    console.warn("[Redis] Failed to connect on startup. The app will continue running without cache/rate-limiting.");
  }
};

export const isRedisReady = () => isRedisConnected && redisClient.isReady;

export default redisClient;
