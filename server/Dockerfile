# ========================================================
# Stage 1: Build & TypeScript Compilation
# ========================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy application source & config
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript to JavaScript in /app/dist
RUN npm run build

# ========================================================
# Stage 2: Production Minimal Runner
# ========================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install dumb-init (PID 1 signal forwarding), wget (healthcheck), and openssl (Prisma runtime requirement on Alpine)
RUN apk add --no-cache dumb-init wget openssl

# Copy package descriptors
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy generated Prisma engine binaries & client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY prisma ./prisma

# Copy compiled TypeScript code
COPY --from=builder /app/dist ./dist

# Expose backend port
EXPOSE 5050

# Use dumb-init as init system
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Run server directly with Node.js
CMD ["node", "dist/index.js"]
