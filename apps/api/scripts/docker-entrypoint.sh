#!/bin/sh
set -eu

MAX_RETRIES="${PRISMA_MIGRATE_MAX_RETRIES:-10}"
SLEEP_SECONDS="${PRISMA_MIGRATE_RETRY_SECONDS:-3}"
ATTEMPT=1

echo "[api] Running Prisma migrations (max retries: ${MAX_RETRIES})..."
until node /app/node_modules/.bin/prisma migrate deploy --schema=/app/apps/api/prisma/schema.prisma; do
  if [ "$ATTEMPT" -ge "$MAX_RETRIES" ]; then
    echo "[api] Prisma migrate deploy failed after ${ATTEMPT} attempt(s)."
    exit 1
  fi
  echo "[api] Migration attempt ${ATTEMPT}/${MAX_RETRIES} failed. Retrying in ${SLEEP_SECONDS}s..."
  ATTEMPT=$((ATTEMPT + 1))
  sleep "$SLEEP_SECONDS"
done


BOOTSTRAP_ADMIN="${BOOTSTRAP_ADMIN_ON_STARTUP:-true}"
if [ "$BOOTSTRAP_ADMIN" = "true" ]; then
  echo "[api] Ensuring bootstrap admin account exists..."
  node /app/apps/api/scripts/bootstrap-admin.js
fi

echo "[api] Starting NestJS API..."
exec node dist/main.js
