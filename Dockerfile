# Multi-stage Dockerfile for Azure Queue Chat Application

# Stage 1: Build the client
FROM node:20-alpine AS client-builder
WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./
RUN npm ci

# Copy client source and build
COPY client/ ./
RUN npm run build

# Stage 2: Build the server
FROM node:20-alpine AS server-builder
WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./
RUN npm ci

# Copy server source and build
COPY server/ ./
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine
WORKDIR /app

# Install production dependencies for root
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built server from builder
COPY --from=server-builder /app/server ./server

# Copy built client from builder
COPY --from=client-builder /app/client/dist ./client/dist

# Expose the server port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "server/dist/index.js"]
