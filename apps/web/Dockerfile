# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments
ARG VITE_API_URL=https://localhost/api
ENV VITE_API_URL=$VITE_API_URL

# Copy workspace files
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web

# Install dependencies
RUN npm ci --workspace=apps/web --workspace=packages/shared

# Build application
WORKDIR /app/apps/web
RUN npm run build

# Production stage - nginx
FROM nginx:1.25-alpine

# Copy custom nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
