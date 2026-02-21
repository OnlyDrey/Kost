-- AlterTable: add categories and paymentMethods to Family
ALTER TABLE "families" ADD COLUMN "categories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "families" ADD COLUMN "paymentMethods" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable: add paymentMethod to Invoice (how the expense was received)
ALTER TABLE "invoices" ADD COLUMN "paymentMethod" TEXT;
