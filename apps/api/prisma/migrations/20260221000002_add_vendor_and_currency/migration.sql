-- Add currency field to families
ALTER TABLE "families" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'NOK';

-- Create vendors table
CREATE TABLE IF NOT EXISTS "vendors" (
  "id"        TEXT NOT NULL,
  "familyId"  TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "logoUrl"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one name per family
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_familyId_name_key" UNIQUE ("familyId", "name");

-- Index for lookups by family
CREATE INDEX IF NOT EXISTS "vendors_familyId_idx" ON "vendors"("familyId");

-- Foreign key to families
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_familyId_fkey"
  FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
