import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from "@nestjs/terminus";
import { PrismaService } from "../prisma/prisma.service";
import { Public } from "../common/decorators/public.decorator";

@Public()
@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: "Health check endpoint" })
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck("database", this.prisma),
    ]);
  }
}
