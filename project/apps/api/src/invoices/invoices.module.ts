import { Module } from "@nestjs/common";
import { InvoicesService } from "./invoices.service";
import { InvoicesController } from "./invoices.controller";
import { AllocationService } from "./allocation.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, AllocationService],
  exports: [InvoicesService, AllocationService],
})
export class InvoicesModule {}
