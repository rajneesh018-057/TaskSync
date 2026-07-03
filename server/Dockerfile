# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install all dependencies (including devDependencies for typescript compilation)
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code and config files
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript
RUN npm run build

# --- Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy generated Prisma Client and schema
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY prisma ./prisma

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port (default is 5050 in configuration)
EXPOSE 5050

# Run database schema push followed by the main server
CMD npx prisma db push && node dist/index.js
