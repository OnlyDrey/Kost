import { Module } from "@nestjs/common";
import { PeriodsService } from "./periods.service";
import { PeriodsController } from "./periods.controller";
import { PeriodClosingService } from "./period-closing.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [PeriodsController],
  providers: [PeriodsService, PeriodClosingService],
  exports: [PeriodsService, PeriodClosingService],
})
export class PeriodsModule {}
