import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CurrentUser, JwtPayload } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { USER_ROLES } from "../common/user-roles";
import { SettlementsService } from "./settlements.service";
import { CreateSettlementEntryDto, ReverseSettlementEntryDto } from "./dto/create-settlement-entry.dto";
import { CreateSettlementPlanDto } from "./dto/create-settlement-plan.dto";

@ApiTags("settlements")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("settlements")
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Get("summary")
  getSummary(@Query("periodId") periodId: string, @CurrentUser("familyId") familyId: string): Promise<any> {
    return this.settlementsService.getPeriodSummary(periodId, familyId);
  }

  @Get("warnings")
  getWarnings(@Query("periodId") periodId: string, @CurrentUser("familyId") familyId: string): Promise<any> {
    return this.settlementsService.getOpeningWarnings(periodId, familyId);
  }

  @Post("entries")
  @Roles(USER_ROLES.ADMIN)
  createEntry(@Body() dto: CreateSettlementEntryDto, @CurrentUser() user: JwtPayload): Promise<any> {
    return this.settlementsService.createEntry(dto, user.familyId, { userId: user.sub, role: user.role });
  }

  @Post("plans")
  @Roles(USER_ROLES.ADMIN)
  createPlan(@Body() dto: CreateSettlementPlanDto, @CurrentUser() user: JwtPayload): Promise<any> {
    return this.settlementsService.createPlan(dto, user.familyId, { userId: user.sub, role: user.role });
  }

  @Post("entries/:periodId/:entryId/reverse")
  @Roles(USER_ROLES.ADMIN)
  reverseEntry(
    @Param("periodId") periodId: string,
    @Param("entryId") entryId: string,
    @Body() dto: ReverseSettlementEntryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.settlementsService.reverseEntry(periodId, entryId, dto, user.familyId, { userId: user.sub, role: user.role });
  }
}
