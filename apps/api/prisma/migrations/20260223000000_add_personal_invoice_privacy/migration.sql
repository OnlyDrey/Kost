-- AlterTable
ALTER TABLE "invoices"
ADD COLUMN "isPersonal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "ownerUserId" TEXT;

-- CreateIndex
CREATE INDEX "invoices_ownerUserId_idx" ON "invoices"("ownerUserId");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
