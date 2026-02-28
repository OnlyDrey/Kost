import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
} from "@nestjs/terminus";
import { SkipThrottle } from "@nestjs/throttler";
import { PrismaService } from "../prisma/prisma.service";
import { Public } from "../common/decorators/public.decorator";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { ConfigService } from "@nestjs/config";

@Public()
@SkipThrottle()
@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: "Health check endpoint" })
  check() {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        await this.prisma.$queryRaw`SELECT 1`;
        return { database: { status: "up" } };
      },
      async (): Promise<HealthIndicatorResult> => {
        const requireWebAssets =
          this.configService.get<boolean>("health.requireWebAssets") ?? false;

        if (!requireWebAssets) {
          return {
            web: {
              status: "up",
              skipped: true,
              reason: "web-asset validation disabled",
            },
          };
        }

        const publicDir = join(process.cwd(), "public");
        const assetsDir = join(publicDir, "assets");
        const hasIndex = existsSync(join(publicDir, "index.html"));
        const hasAssetFiles =
          existsSync(assetsDir) && readdirSync(assetsDir).length > 0;

        if (!hasIndex || !hasAssetFiles) {
          throw new Error("Web assets missing");
        }

        return { web: { status: "up" } };
      },
    ]);
  }
}
