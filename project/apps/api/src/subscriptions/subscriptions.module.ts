import { Module } from "@nestjs/common";
import { SubscriptionsService } from "./subscriptions.service";
import { SubscriptionsController } from "./subscriptions.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { AllocationService } from "../invoices/allocation.service";

@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, AllocationService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
