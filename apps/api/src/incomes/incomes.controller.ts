import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { IncomesService } from "./incomes.service";
import { CreateIncomeDto } from "./dto/create-income.dto";
import { UpdateIncomeDto } from "./dto/update-income.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags("incomes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("incomes")
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Get()
  @ApiOperation({ summary: "Get all incomes for a period" })
  @ApiQuery({ name: "periodId", required: true, example: "2024-01" })
  @ApiResponse({ status: 200, description: "List of incomes" })
  findByPeriod(
    @Query("periodId") periodId: string,
    @CurrentUser("familyId") familyId: string,
  ) {
    return this.incomesService.findByPeriod(periodId, familyId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific income by ID" })
  @ApiResponse({ status: 200, description: "Income details" })
  @ApiResponse({ status: 404, description: "Income not found" })
  findOne(@Param("id") id: string, @CurrentUser("familyId") familyId: string) {
    return this.incomesService.findOne(id, familyId);
  }

  @Post()
  @ApiOperation({ summary: "Create or update income for a user in a period" })
  @ApiResponse({
    status: 201,
    description: "Income created/updated successfully",
  })
  @ApiResponse({ status: 400, description: "Period is closed" })
  @ApiResponse({ status: 404, description: "User or period not found" })
  create(
    @Body() createIncomeDto: CreateIncomeDto,
    @CurrentUser("familyId") familyId: string,
  ) {
    return this.incomesService.createOrUpdate(createIncomeDto, familyId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an income" })
  @ApiResponse({ status: 200, description: "Income updated successfully" })
  @ApiResponse({ status: 400, description: "Period is closed" })
  @ApiResponse({ status: 404, description: "Income not found" })
  update(
    @Param("id") id: string,
    @Body() updateIncomeDto: UpdateIncomeDto,
    @CurrentUser("familyId") familyId: string,
  ) {
    return this.incomesService.update(id, updateIncomeDto, familyId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an income" })
  @ApiResponse({ status: 200, description: "Income deleted successfully" })
  @ApiResponse({ status: 400, description: "Period is closed" })
  @ApiResponse({ status: 404, description: "Income not found" })
  remove(@Param("id") id: string, @CurrentUser("familyId") familyId: string) {
    return this.incomesService.remove(id, familyId);
  }
}
