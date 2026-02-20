# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Install all dependencies (hoisted to /app/node_modules by npm workspaces)
RUN npm ci --workspace=apps/api --workspace=packages/shared

# Build shared package so TypeScript can resolve @kost/shared
RUN npm run build --workspace=packages/shared

# Generate Prisma client and build API
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build
RUN npx tsc -p tsconfig.seed.json

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for signal handling and openssl for Prisma query engine
RUN apk add --no-cache dumb-init openssl

# Create non-root user early so we can set ownership below
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files needed for npm ci
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/api/package.json ./apps/api/

# Install production dependencies only (hoisted to /app/node_modules).
# prisma is now a production dependency so its CLI is available at startup.
RUN npm ci --workspace=apps/api --workspace=packages/shared --omit=dev

# Copy the pre-built Prisma client from builder so UserRole and other
# generated types are available immediately at runtime.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built artifacts from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Give the non-root user write access to both the generated client (.prisma)
# and the engine binaries (@prisma/engines) which Prisma writes to at runtime.
RUN chown -R nestjs:nodejs /app/node_modules/.prisma /app/node_modules/@prisma

USER nestjs

WORKDIR /app/apps/api

# Expose port
EXPOSE 3000

# Health check — endpoint lives under the /api global prefix
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "node /app/node_modules/.bin/prisma migrate deploy && node dist/main.js"]
