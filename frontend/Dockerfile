# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy sources and build
COPY . .
RUN npm run build

# --- Runner Stage ---
FROM nginx:stable-alpine AS runner

# Copy built application assets to Nginx default public directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx custom configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (standard HTTP port inside container)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
