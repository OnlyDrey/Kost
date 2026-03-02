-- Add PERSONAL distribution method
ALTER TYPE "DistributionMethod" ADD VALUE IF NOT EXISTS 'PERSONAL';

-- Subscription additions
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "isPersonal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "ownerUserId" TEXT;

ALTER TABLE "subscriptions"
  ADD CONSTRAINT "subscriptions_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "subscriptions_ownerUserId_idx" ON "subscriptions"("ownerUserId");
