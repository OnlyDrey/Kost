#!/bin/sh
set -eu

MAX_RETRIES="${PRISMA_MIGRATE_MAX_RETRIES:-10}"
SLEEP_SECONDS="${PRISMA_MIGRATE_RETRY_SECONDS:-3}"
ATTEMPT=1

# Use prisma db push to apply the current schema to the database without
# requiring migration files. A new prisma migrate dev --name init should be
# run when the schema is stable to create a tracked migration baseline.
echo "[api] Applying Prisma schema (db push, max retries: ${MAX_RETRIES})..."
until node /app/node_modules/.bin/prisma db push --schema=/app/apps/api/prisma/schema.prisma --accept-data-loss; do
  if [ "$ATTEMPT" -ge "$MAX_RETRIES" ]; then
    echo "[api] Prisma db push failed after ${ATTEMPT} attempt(s)."
    exit 1
  fi
  echo "[api] db push attempt ${ATTEMPT}/${MAX_RETRIES} failed. Retrying in ${SLEEP_SECONDS}s..."
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
