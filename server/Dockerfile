# Stage 1 — Build
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./
RUN npm install --production=false

# Copy source files
COPY . .

# Build TypeScript or transpile
RUN npm run build

# Stage 2 — Production
FROM node:20-alpine AS production
WORKDIR /app

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy only what is needed from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Set environment variable
ENV NODE_ENV=production
ENV PORT=5001

EXPOSE 5001

# Start the app
CMD ["node", "dist/index.js"]
