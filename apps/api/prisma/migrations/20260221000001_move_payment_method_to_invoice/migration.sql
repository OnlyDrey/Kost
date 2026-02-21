-- Move paymentMethod from payments to invoices
-- Drop from payments if it exists (added by previous migration iteration)
ALTER TABLE "payments" DROP COLUMN IF EXISTS "paymentMethod";

-- Add to invoices
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
