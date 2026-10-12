# 🚀 TaskSync: Redis Rate Limiting, Caching & Docker Compose Orchestration

This document details the **Backend System Design** and **DevOps Architecture** implemented in TaskSync, tailored for system design and DevOps technical discussions.

---

## 🏗️ 1. High-Level Architecture Topology

```
+------------------------------------------------------------------------------------+
|                                    CLIENT (Browser)                                |
+-----------------------------------------+------------------------------------------+
                                          | HTTP / HTTPS (:5173 / :80)
                                          v
+------------------------------------------------------------------------------------+
|                         FRONTEND CONTAINER: tasksync-frontend                      |
|  - Nginx Reverse Proxy & Static SPA Server (Gzip enabled, Security Headers)        |
|  - /           -> Serves compiled React 18 + Vite SPA Assets (immutable caching)   |
|  - /healthz    -> Instant L4/L7 healthcheck                                        |
|  - /api/*      -> Proxies upstream to Express backend with client IP forwarding    |
+-----------------------------------------+------------------------------------------+
                                          | Internal Bridge Network (tasksync-network)
                                          v
+------------------------------------------------------------------------------------+
|                          BACKEND CONTAINER: tasksync-backend                       |
|  - Express.js + TypeScript on Node.js 20 Alpine                                    |
|  - PID 1 managed by dumb-init (SIGTERM / SIGINT graceful connection draining)       |
|  - Middleware Pipeline:                                                            |
|      1. Request Logger & CORS                                                      |
|      2. Global Distributed Rate Limiter (Redis)                                    |
|      3. JWT Authentication                                                         |
|      4. Specialized Tiered Limiters (Auth Brute-Force & AI Quotas)                  |
|      5. Cache-Aside Middleware (Inspects Redis before Database)                    |
+-------------------+-----------------------------------------+----------------------+
                    |                                         |
     (Cache / Rate) | ioredis (:6379)         (Persistent DB) | Prisma ORM (:5432)
                    v                                         v
+-----------------------------------+     +------------------------------------------+
|  CACHE CONTAINER: tasksync-redis  |     |   DATABASE CONTAINER: tasksync-db        |
|  - Redis 7 Alpine                 |     |   - PostgreSQL 15 Alpine                 |
|  - AOF (Append-Only) Persistence  |     |   - Volume: tasksync-postgres-data       |
|  - 256MB Max Memory + LRU Eviction|     |   - Healthcheck: pg_isready              |
|  - Volume: tasksync-redis-data    |     |   - Schema: Users, Tasks, Goals, etc.    |
|  - Healthcheck: redis-cli ping    |     +------------------------------------------+
+-----------------------------------+
```

---

## ⚡ 2. Redis Rate Limiting (Backend System Design)

### Why Redis instead of In-Memory Rate Limiting?
In a scalable, horizontally distributed system with multiple API replicas running behind a load balancer, standard in-memory rate limiters maintain isolated state in each node's RAM. An attacker could bypass limits by distributing requests across replicas. **Redis provides a single, high-throughput, centralized state store** ensuring rate limits apply cluster-wide across all backend instances.

### Multi-Tiered Rate Limiting Policies
Implemented in [`server/src/middleware/rateLimiter.ts`](file:///c:/Users/VIVEK/OneDrive/Desktop/life-saver/server/src/middleware/rateLimiter.ts):

| Limiter | Target Routes | Quota Window | Purpose / Attack Vector Mitigated |
| :--- | :--- | :--- | :--- |
| **`generalApiLimiter`** | `/api/*` | **200 req / 15 min** | General scraping prevention & volumetric DoS mitigation |
| **`authLimiter`** | `/api/auth/login`, `/register` | **10 req / 15 min** | Protects against credential stuffing & password brute-force attacks |
| **`aiLimiter`** | `/api/suggest-alignment`, `/chat`, `/prioritize` | **20 req / 1 min** | Protects expensive LLM inference compute & external token quotas |

### Rate Limiter System Design Highlights:
1. **Sliding Window via Redis Store**:
   Backed by `rate-limit-redis` using atomic Redis operations (`MULTI`/`EXEC` or Lua scripts), preventing race conditions between concurrent requests.
2. **Reverse Proxy IP Transparency**:
   Extracts true client IPs from `X-Forwarded-For` set by Nginx, preventing IP spoofing or conflating all users under the container IP.
3. **Graceful Fallback**:
   If Redis becomes temporarily unreachable, the rate limiter automatically degrades to local memory without crashing the server.
4. **Standardized Response Headers**:
   - `RateLimit-Limit`: Maximum requests allowed in the window.
   - `RateLimit-Remaining`: Remaining request allowance.
   - `RateLimit-Reset`: Seconds until quota reset.
   - `Retry-After`: Returned on HTTP `429 Too Many Requests`.

---

## 🏎️ 3. Redis Caching Architecture (Backend System Design)

### Cache-Aside (Lazy Loading) Pattern
Implemented in [`server/src/middleware/cache.ts`](file:///c:/Users/VIVEK/OneDrive/Desktop/life-saver/server/src/middleware/cache.ts):

```
Client GET /api/tasks
        │
        ▼
   [Check Redis]
   ├── HIT  ──► Return JSON immediately with Header "X-Cache: HIT" (~2ms)
   │
   └── MISS ──► Query PostgreSQL via Prisma (~85ms)
                    │
                    ├── Async SET in Redis with TTL (e.g., 120s)
                    └── Return JSON with Header "X-Cache: MISS"
```

### Invalidation on Write (Write-Through Invalidation)
When data is mutated via `POST`, `PUT`, or `DELETE` on tasks, goals, or schedule items:
1. The database mutation executes.
2. The server triggers `invalidateUserCache(userId)`.
3. The user's cached keys (`cache:tasks:<userId>`, `cache:goals:<userId>`, etc.) are purged immediately.
4. The next read guarantees strongly consistent, fresh data without waiting for the TTL to expire.

### Non-Blocking Key Invalidation via `SCAN`
> 💡 **Key System Design Interview Point:**  
> In production Redis, never execute the `KEYS` command because Redis is single-threaded; `KEYS` can block the server for seconds on large keyspaces.  
> TaskSync's [`cacheInvalidatePattern()`](file:///c:/Users/VIVEK/OneDrive/Desktop/life-saver/server/src/redis.ts) utilizes **cursor-based `SCAN` with count chunks (100)** to safely iterate and delete matching keys without blocking the event loop.

### AI Inference Response Caching
In [`server/src/routes/ai.ts`](file:///c:/Users/VIVEK/OneDrive/Desktop/life-saver/server/src/routes/ai.ts), `/suggest-alignment` computes a deterministic MD5 hash of the active workload (`tasks`, `goals`, `timeOfDay`). If an identical request is submitted within 90 seconds, it is served directly from Redis:
- **Groq LLM Latency:** ~1,200ms - 1,800ms
- **Redis Cached Latency:** ~2ms - 5ms
- **Token Savings:** 100% on duplicate dashboard tab switches or refreshes.

### Cache Eviction Policy
Configured in `docker-compose.yml`:
```bash
redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
```
- **LRU (Least Recently Used):** Automatically evicts keys that haven't been accessed recently when RAM reaches 256MB.
- **AOF Persistence:** Guarantees data durability across container restarts.

---

## 🐳 4. Docker Compose Orchestration (DevOps Best Practices)

### 1. Eliminating Race Conditions with Service Healthchecks
In standard Docker Compose, `depends_on` only checks if a container has been created. If the server starts and executes `npx prisma db push` before PostgreSQL finishes initializing, the process crashes with `ECONNREFUSED`.

**DevOps Solution in TaskSync:**
```yaml
# PostgreSQL Healthcheck
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres -d tasksync"]
  interval: 5s
  timeout: 5s
  retries: 5
  start_period: 10s

# Server starts ONLY when both DB and Redis are fully healthy
depends_on:
  db:
    condition: service_healthy
  redis:
    condition: service_healthy
```

### 2. Multi-Stage Dockerfile Optimization
Implemented in [`server/Dockerfile`](file:///c:/Users/VIVEK/OneDrive/Desktop/life-saver/server/Dockerfile) and [`frontend/Dockerfile`](file:///c:/Users/VIVEK/OneDrive/Desktop/life-saver/frontend/Dockerfile):
- **Stage 1 (Builder):** Uses full Node tooling to compile TypeScript and bundle assets.
- **Stage 2 (Runner):** Uses lightweight Alpine image containing **only production dependencies**, pruning build tools and devDependencies.
- `.dockerignore` filters out `node_modules` and local OS binaries from the build context.

### 3. Graceful Shutdown & PID 1 Signal Handling
Containers run with `dumb-init` as the init process (`ENTRYPOINT ["/usr/bin/dumb-init", "--"]`). When Docker stops a container (`docker stop`), `SIGTERM` is cleanly forwarded to Node.js:
- Express stops accepting new connections.
- Existing in-flight requests finish processing.
- Redis client disconnects cleanly via `redisClient.quit()`.
- Prisma database pool disconnects via `prisma.$disconnect()`.

### 4. Container Log Rotation
All services enforce log rotation to prevent infinite disk consumption:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 5. Multi-Tenant Key Isolation & Port 6379
- **Host Port 6379**: TaskSync standardizes on Redis port 6379 across local development, Docker Compose, and cloud environments.
- **Key Isolation via `REDIS_KEY_PREFIX`**: All Redis keys across caching, distributed rate limiting, and BullMQ queues are automatically prefixed (defaulting to `tasksync:`).
  - Cache: `tasksync:cache:...`
  - Rate Limiter: `tasksync:rl:...`
  - BullMQ Queue: `{tasksync}:tasksync-jobs:...`
- **Zero Collision Guarantee**: If other applications or projects share the same Redis instance on 6379, TaskSync's keys remain completely segregated and isolated.

### 6. Production Upstash Redis Architecture
When switching to cloud-managed Upstash Redis in production:
1. **Option A: Redis TLS Connection String (Native ioredis protocol)**
   Set `REDIS_URL` in your production environment:
   ```env
   REDIS_URL="rediss://default:<UPSTASH_PASSWORD>@<YOUR_UPSTASH_ENDPOINT>.upstash.io:6379"
   ```
   The backend automatically detects the `rediss://` protocol and activates TLS encryption (`tls: { rejectUnauthorized: false }`).
2. **Option B: Upstash REST Credentials**
   If using REST credentials:
   ```env
   UPSTASH_REDIS_REST_URL="https://<YOUR_UPSTASH_ENDPOINT>.upstash.io"
   UPSTASH_REDIS_REST_TOKEN="<YOUR_UPSTASH_TOKEN>"
   ```
   The backend dynamically maps these credentials into a secure TLS connection.
3. **Log & Telemetry Masking**:
   All passwords and tokens in Redis URLs are automatically masked (`******`) in container logs, `/api/health`, and `/api/system/metrics` to prevent secret leakage.

---

## 🧪 5. Testing & Verification Guide

### 1. Start the Full Stack with Docker Compose
```bash
# Start all 4 containers in detached mode
npm run docker:up

# Check container health and status
npm run docker:status
```

### 2. Verify Health Probe
```bash
curl -i http://localhost:5050/api/health
```
**Sample Response:**
```json
{
  "status": "ok",
  "totalDurationMs": 4,
  "checks": {
    "server": "healthy",
    "database": { "status": "healthy", "latencyMs": 2 },
    "redis": { "status": "connected", "latencyMs": 1, "url": "redis://redis:6379" },
    "uptimeSeconds": 42,
    "memoryUsageMB": { "rss": 68, "heapUsed": 24 }
  }
}
```

### 3. Inspect Redis & System Design Metrics
```bash
curl -s http://localhost:5050/api/system/metrics | jq .
```

### 4. Verify Caching via Headers
```bash
# First request -> Cache MISS (populated to Redis)
curl -i -H "Authorization: Bearer <TOKEN>" http://localhost:5050/api/tasks | grep X-Cache
# Output: X-Cache: MISS

# Second request within 120s -> Cache HIT
curl -i -H "Authorization: Bearer <TOKEN>" http://localhost:5050/api/tasks | grep X-Cache
# Output: X-Cache: HIT
```

### 5. Verify Rate Limiting
Test with 11 rapid requests to the login endpoint to trigger HTTP 429:
```bash
for i in {1..12}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5050/api/auth/login \
    -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"wrong"}'
done
```
Output will return `400` for the first 10 attempts and `429 Too Many Requests` thereafter, returning headers `Retry-After: 900` and `RateLimit-Remaining: 0`.

### 6. Interactive Redis CLI inside Container
```bash
npm run docker:redis
# Inside redis-cli:
127.0.0.1:6379> KEYS *
127.0.0.1:6379> INFO memory
127.0.0.1:6379> MONITOR
```

---

