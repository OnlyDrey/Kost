# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:22-alpine

FROM ${NODE_IMAGE} AS builder
WORKDIR /app

RUN apk add --no-cache openssl

ARG VITE_API_URL=/api
ARG VITE_ENABLE_PWA=false
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ENABLE_PWA=$VITE_ENABLE_PWA

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY tsconfig.base.json ./

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
  npm ci --workspaces --include-workspace-root

COPY packages ./packages
COPY apps/api ./apps/api
COPY apps/web ./apps/web

RUN npm run build --workspace=@kost/shared
RUN npm run generate --workspace=@kost/api
RUN npm run typecheck --workspace=@kost/web
RUN npm run build --workspace=@kost/web
RUN npm run build --workspace=@kost/api
RUN npx tsc -p apps/api/tsconfig.seed.json

ARG NODE_IMAGE
FROM ${NODE_IMAGE} AS runtime
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache dumb-init openssl curl
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
  npm ci --omit=dev --workspace=@kost/api --workspace=@kost/shared

COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
RUN npm run generate --workspace=@kost/api

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/web/dist ./apps/api/public
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY apps/api/scripts /app/apps/api/scripts

RUN mkdir -p /app/apps/api/uploads/avatars /app/apps/api/uploads/vendors && \
  chown -R nestjs:nodejs /app/apps/api /app/packages/shared /app/node_modules

USER nestjs
WORKDIR /app/apps/api

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=50s --retries=3 \
  CMD node -e "const http=require('http');const checks=['http://localhost:3000/api/health','http://localhost:3000/'];let pending=checks.length;let failed=false;for(const url of checks){http.get(url,(r)=>{if(r.statusCode!==200)failed=true;r.resume();if(--pending===0)process.exit(failed?1:0)}).on('error',()=>{failed=true;if(--pending===0)process.exit(1)})}"

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "/app/apps/api/scripts/docker-entrypoint.sh"]
