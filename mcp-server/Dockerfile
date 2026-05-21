# ---- Build stage ----
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm install
COPY src ./src
RUN npm run build

# ---- Production stage ----
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV production

# Copy package files and install only production dependencies
COPY --from=builder /app/package*.json ./
RUN npm install --only=production
COPY --from=builder /app/build ./build

# Cloud Run defaults to exposing port 8080 by default, but we expose 3000 as metadata
EXPOSE 3000

# Start server in SSE transport mode
CMD ["node", "build/index.js", "--sse"]
