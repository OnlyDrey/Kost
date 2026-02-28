-- Add currencySymbolPosition to families table
-- 'Before' = symbol before number (e.g. $1,234.00)
-- 'After'  = symbol after number  (e.g. 1.234,00 kr)
ALTER TABLE "families" ADD COLUMN "currencySymbolPosition" TEXT NOT NULL DEFAULT 'Before';
