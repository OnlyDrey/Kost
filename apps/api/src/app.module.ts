import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import configuration from "./config/configuration";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { PeriodsModule } from "./periods/periods.module";
import { IncomesModule } from "./incomes/incomes.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { PaymentsModule } from "./payments/payments.module";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module";
import { AuditModule } from "./audit/audit.module";
import { HealthModule } from "./health/health.module";
import { FamilyModule } from "./family/family.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    PeriodsModule,
    IncomesModule,
    InvoicesModule,
    PaymentsModule,
    SubscriptionsModule,
    AuditModule,
    HealthModule,
    FamilyModule,
  ],
})
export class AppModule {}
