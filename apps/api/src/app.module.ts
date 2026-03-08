import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
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
import { SettlementsModule } from "./settlements/settlements.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const ttlSeconds = configService.get<number>("rateLimit.ttl") ?? 60;
        const max = configService.get<number>("rateLimit.max") ?? 120;

        return [
          {
            ttl: ttlSeconds * 1000,
            limit: max,
          },
        ];
      },
    }),
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
    SettlementsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
