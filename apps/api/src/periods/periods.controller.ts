import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { PeriodsService } from "./periods.service";
import { PeriodClosingService } from "./period-closing.service";
import { CreatePeriodDto } from "./dto/create-period.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import {
  CurrentUser,
  JwtPayload,
} from "../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("periods")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("periods")
export class PeriodsController {
  constructor(
    private readonly periodsService: PeriodsService,
    private readonly periodClosingService: PeriodClosingService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get all periods for the family" })
  @ApiResponse({ status: 200, description: "List of periods" })
  findAll(@CurrentUser("familyId") familyId: string) {
    return this.periodsService.findAll(familyId);
  }

  @Get("current")
  @ApiOperation({ summary: "Get the current open period" })
  @ApiResponse({ status: 200, description: "Current open period" })
  @ApiResponse({ status: 404, description: "No open period found" })
  getCurrentPeriod(@CurrentUser("familyId") familyId: string) {
    return this.periodsService.getCurrentPeriod(familyId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific period by ID" })
  @ApiResponse({
    status: 200,
    description: "Period details with invoices and incomes",
  })
  @ApiResponse({ status: 404, description: "Period not found" })
  findOne(@Param("id") id: string, @CurrentUser("familyId") familyId: string) {
    return this.periodsService.findOne(id, familyId);
  }

  @Get(":id/stats")
  @ApiOperation({ summary: "Get period stats summary" })
  @ApiResponse({ status: 200, description: "Period stats" })
  @ApiResponse({ status: 404, description: "Period not found" })
  getPeriodStats(
    @Param("id") id: string,
    @CurrentUser("familyId") familyId: string,
  ) {
    return this.periodsService.getPeriodStats(id, familyId);
  }

  @Get(":id/status")
  @ApiOperation({ summary: "Get period status and statistics" })
  @ApiResponse({
    status: 200,
    description: "Period status with payment summaries",
  })
  @ApiResponse({ status: 404, description: "Period not found" })
  getPeriodStatus(
    @Param("id") id: string,
    @CurrentUser("familyId") familyId: string,
  ) {
    return this.periodsService.getPeriodStatus(id, familyId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ADULT)
  @ApiOperation({ summary: "Create a new period" })
  @ApiResponse({ status: 201, description: "Period created successfully" })
  @ApiResponse({ status: 409, description: "Period already exists" })
  create(
    @Body() createPeriodDto: CreatePeriodDto,
    @CurrentUser("familyId") familyId: string,
  ) {
    return this.periodsService.create(createPeriodDto, familyId);
  }

  @Post(":id/close")
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Close a period and calculate settlements (Admin only)",
  })
  @ApiResponse({
    status: 200,
    description: "Period closed successfully with settlement data",
  })
  @ApiResponse({ status: 400, description: "Period is already closed" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin only" })
  closePeriod(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.periodClosingService.closePeriod(id, user.familyId, user.sub);
  }

  @Post(":id/reopen")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Reopen a closed period (Admin only)" })
  @ApiResponse({ status: 200, description: "Period reopened successfully" })
  @ApiResponse({ status: 400, description: "Period is already open" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin only" })
  reopenPeriod(
    @Param("id") id: string,
    @CurrentUser("familyId") familyId: string,
  ) {
    return this.periodClosingService.reopenPeriod(id, familyId);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Delete an empty period (Admin only)" })
  @ApiResponse({ status: 200, description: "Period deleted successfully" })
  @ApiResponse({ status: 409, description: "Period has invoices or incomes" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin only" })
  remove(@Param("id") id: string, @CurrentUser("familyId") familyId: string) {
    return this.periodsService.remove(id, familyId);
  }
}
