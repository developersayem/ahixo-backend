# Stage 1 — Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2 — Production
FROM node:20-alpine
WORKDIR /app

# Copy only what we need from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

ENV PORT=5001
EXPOSE 5001

# Use node directly
CMD ["node", "dist/index.js"]
