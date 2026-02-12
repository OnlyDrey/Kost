import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions for the family' })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of subscriptions' })
  findAll(@CurrentUser('familyId') familyId: string, @Query('active') active?: string) {
    const activeOnly = active === 'true';
    return this.subscriptionsService.findAll(familyId, activeOnly);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active subscriptions' })
  @ApiResponse({ status: 200, description: 'List of active subscriptions' })
  findActive(@CurrentUser('familyId') familyId: string) {
    return this.subscriptionsService.findActive(familyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific subscription by ID' })
  @ApiResponse({ status: 200, description: 'Subscription details' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  findOne(@Param('id') id: string, @CurrentUser('familyId') familyId: string) {
    return this.subscriptionsService.findOne(id, familyId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ADULT)
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  create(@Body() createSubscriptionDto: CreateSubscriptionDto, @CurrentUser('familyId') familyId: string) {
    return this.subscriptionsService.create(createSubscriptionDto, familyId);
  }

  @Post('generate/:periodId')
  @Roles(UserRole.ADMIN, UserRole.ADULT)
  @ApiOperation({ summary: 'Generate invoices from subscriptions for a period' })
  @ApiResponse({ status: 201, description: 'Invoices generated from subscriptions' })
  @ApiResponse({ status: 400, description: 'No incomes found for period' })
  @ApiResponse({ status: 404, description: 'Period not found' })
  generateInvoices(@Param('periodId') periodId: string, @CurrentUser('familyId') familyId: string) {
    return this.subscriptionsService.generateInvoicesForPeriod(periodId, familyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ADULT)
  @ApiOperation({ summary: 'Update a subscription' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    @CurrentUser('familyId') familyId: string,
  ) {
    return this.subscriptionsService.update(id, updateSubscriptionDto, familyId);
  }

  @Patch(':id/toggle')
  @Roles(UserRole.ADMIN, UserRole.ADULT)
  @ApiOperation({ summary: 'Toggle subscription active status' })
  @ApiResponse({ status: 200, description: 'Subscription status toggled' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  toggleActive(@Param('id') id: string, @CurrentUser('familyId') familyId: string) {
    return this.subscriptionsService.toggleActive(id, familyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a subscription (Admin only)' })
  @ApiResponse({ status: 200, description: 'Subscription deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  remove(@Param('id') id: string, @CurrentUser('familyId') familyId: string) {
    return this.subscriptionsService.remove(id, familyId);
  }
}
