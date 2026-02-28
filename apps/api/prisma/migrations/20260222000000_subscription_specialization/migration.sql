-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELED');

-- AlterTable
ALTER TABLE "subscriptions"
ADD COLUMN "plan" TEXT,
ADD COLUMN "nextBillingAt" TIMESTAMP(3),
ADD COLUMN "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE';

-- Backfill nextBillingAt from startDate for existing rows
UPDATE "subscriptions"
SET "nextBillingAt" = "startDate"
WHERE "nextBillingAt" IS NULL;
