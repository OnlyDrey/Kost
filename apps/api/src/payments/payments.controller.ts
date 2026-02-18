import {
  Controller,
  Get,
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
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("payments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: "Get all payments for a period" })
  @ApiQuery({ name: "periodId", required: true, example: "2024-01" })
  @ApiResponse({ status: 200, description: "List of payments" })
  findByPeriod(
    @Query("periodId") periodId: string,
    @CurrentUser("familyId") familyId: string,
  ) {
    return this.paymentsService.findByPeriod(periodId, familyId);
  }

  @Get("user/:userId")
  @ApiOperation({ summary: "Get all payments made by a specific user" })
  @ApiQuery({ name: "periodId", required: false, example: "2024-01" })
  @ApiResponse({ status: 200, description: "List of payments by user" })
  findByUser(
    @Param("userId") userId: string,
    @Query("periodId") periodId: string | undefined,
    @CurrentUser("familyId") familyId: string,
  ) {
    return this.paymentsService.findByUser(userId, familyId, periodId);
  }

  @Get("summary/period/:periodId")
  @ApiOperation({ summary: "Get payment summary for all users in a period" })
  @ApiResponse({
    status: 200,
    description: "Payment summary showing who owes what",
  })
  getPeriodSummary(
    @Param("periodId") periodId: string,
    @CurrentUser("familyId") familyId: string,
  ) {
    return this.paymentsService.getPeriodPaymentSummary(periodId, familyId);
  }

  @Get("summary/user/:userId/period/:periodId")
  @ApiOperation({
    summary: "Get payment summary for a specific user in a period",
  })
  @ApiResponse({ status: 200, description: "User payment summary" })
  getUserSummary(
    @Param("userId") userId: string,
    @Param("periodId") periodId: string,
    @CurrentUser("familyId") familyId: string,
  ) {
    return this.paymentsService.getUserPaymentSummary(
      userId,
      periodId,
      familyId,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific payment by ID" })
  @ApiResponse({ status: 200, description: "Payment details" })
  @ApiResponse({ status: 404, description: "Payment not found" })
  findOne(@Param("id") id: string, @CurrentUser("familyId") familyId: string) {
    return this.paymentsService.findOne(id, familyId);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Delete a payment (Admin only)" })
  @ApiResponse({ status: 200, description: "Payment deleted successfully" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin only" })
  @ApiResponse({ status: 404, description: "Payment not found" })
  remove(@Param("id") id: string, @CurrentUser("familyId") familyId: string) {
    return this.paymentsService.remove(id, familyId);
  }
}
