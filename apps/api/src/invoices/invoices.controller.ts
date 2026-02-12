import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all invoices for a period' })
  @ApiQuery({ name: 'periodId', required: true, example: '2024-01' })
  @ApiResponse({ status: 200, description: 'List of invoices with shares and payments' })
  findByPeriod(@Query('periodId') periodId: string, @CurrentUser('familyId') familyId: string) {
    return this.invoicesService.findByPeriod(periodId, familyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice details with shares and payments' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  findOne(@Param('id') id: string, @CurrentUser('familyId') familyId: string) {
    return this.invoicesService.findOne(id, familyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new invoice with automatic share calculation' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or period is closed' })
  @ApiResponse({ status: 404, description: 'Period not found' })
  create(@Body() createInvoiceDto: CreateInvoiceDto, @CurrentUser('familyId') familyId: string) {
    return this.invoicesService.create(createInvoiceDto, familyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an invoice (recalculates shares if distribution changes)' })
  @ApiResponse({ status: 200, description: 'Invoice updated successfully' })
  @ApiResponse({ status: 400, description: 'Period is closed' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @CurrentUser('familyId') familyId: string,
  ) {
    return this.invoicesService.update(id, updateInvoiceDto, familyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice deleted successfully' })
  @ApiResponse({ status: 400, description: 'Period is closed' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  remove(@Param('id') id: string, @CurrentUser('familyId') familyId: string) {
    return this.invoicesService.remove(id, familyId);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Add a payment to an invoice' })
  @ApiResponse({ status: 201, description: 'Payment added successfully' })
  @ApiResponse({ status: 400, description: 'Payment exceeds invoice total' })
  @ApiResponse({ status: 404, description: 'Invoice or user not found' })
  addPayment(
    @Param('id') id: string,
    @Body() addPaymentDto: AddPaymentDto,
    @CurrentUser('familyId') familyId: string,
  ) {
    return this.invoicesService.addPayment(id, addPaymentDto, familyId);
  }
}
