import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AllocationService } from "./allocation.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";
import { AddPaymentDto } from "./dto/add-payment.dto";
import { DistributionMethod, PeriodStatus } from "@prisma/client";

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private allocationService: AllocationService,
  ) {}

  /**
   * Get all invoices for a period
   */
  async findByPeriod(periodId: string, familyId: string) {
    // Verify period belongs to family
    const period = await this.prisma.period.findFirst({
      where: { id: periodId, familyId },
    });

    if (!period) {
      throw new NotFoundException(`Period ${periodId} not found`);
    }

    return this.prisma.invoice.findMany({
      where: { periodId, familyId },
      include: {
        lines: true,
        distribution: true,
        shares: {
          include: {
            user: {
              select: { id: true, name: true, username: true },
            },
          },
        },
        payments: {
          include: {
            paidBy: {
              select: { id: true, name: true, username: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get a specific invoice by ID
   */
  async findOne(id: string, familyId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, familyId },
      include: {
        lines: true,
        distribution: true,
        shares: {
          include: {
            user: {
              select: { id: true, name: true, username: true, role: true },
            },
          },
        },
        payments: {
          include: {
            paidBy: {
              select: { id: true, name: true, username: true },
            },
          },
          orderBy: { paidAt: "desc" },
        },
        period: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  /**
   * Create a new invoice and calculate shares using AllocationService
   */
  async create(createInvoiceDto: CreateInvoiceDto, familyId: string) {
    const {
      periodId,
      distributionMethod,
      lines,
      distributionRules,
      ...invoiceData
    } = createInvoiceDto;

    // Verify period belongs to family and is open
    const period = await this.prisma.period.findFirst({
      where: { id: periodId, familyId },
    });

    if (!period) {
      throw new NotFoundException(`Period ${periodId} not found`);
    }

    if (period.status === PeriodStatus.CLOSED) {
      throw new BadRequestException("Cannot add invoice to a closed period");
    }

    // Validate lines sum to total if provided
    if (lines && lines.length > 0) {
      const linesSum = lines.reduce((sum, line) => sum + line.amountCents, 0);
      if (linesSum !== createInvoiceDto.totalCents) {
        throw new BadRequestException(
          `Sum of invoice lines (${linesSum}) does not match total (${createInvoiceDto.totalCents})`,
        );
      }
    }

    // Get all users with incomes in this period for allocation
    const incomes = await this.prisma.income.findMany({
      where: { periodId },
      include: {
        user: true,
      },
    });

    if (incomes.length === 0) {
      throw new BadRequestException(
        "No users with income found for this period. Add incomes first.",
      );
    }

    // Calculate shares based on distribution method
    const shares = await this.calculateShares(
      createInvoiceDto.totalCents,
      distributionMethod,
      distributionRules,
      incomes.map((inc) => ({
        userId: inc.userId,
        userName: inc.user.name,
        normalizedMonthlyGrossCents: inc.normalizedMonthlyGrossCents,
      })),
    );

    // Create invoice with lines, distribution rules, and shares in a transaction
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          familyId,
          periodId,
          category: invoiceData.category,
          vendor: invoiceData.vendor,
          description: invoiceData.description,
          dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : null,
          totalCents: createInvoiceDto.totalCents,
          distributionMethod,
          lines: lines
            ? {
                create: lines.map((line) => ({
                  description: line.description,
                  amountCents: line.amountCents,
                })),
              }
            : undefined,
          distribution:
            distributionRules &&
            (distributionRules.percentRules || distributionRules.fixedRules)
              ? {
                  create: {
                    method: distributionMethod,
                    percentRules: distributionRules.percentRules
                      ? JSON.parse(
                          JSON.stringify(distributionRules.percentRules),
                        )
                      : null,
                    fixedRules: distributionRules.fixedRules
                      ? JSON.parse(JSON.stringify(distributionRules.fixedRules))
                      : null,
                    remainderMethod: distributionRules.remainderMethod || null,
                  },
                }
              : undefined,
          shares: {
            create: shares.map((share) => ({
              userId: share.userId,
              shareCents: share.shareCents,
              explanation: share.explanation,
            })),
          },
        },
        include: {
          lines: true,
          distribution: true,
          shares: {
            include: {
              user: {
                select: { id: true, name: true, username: true },
              },
            },
          },
        },
      });

      return invoice;
    });
  }

  /**
   * Update an invoice (recalculates shares if distribution changes)
   */
  async update(
    id: string,
    updateInvoiceDto: UpdateInvoiceDto,
    familyId: string,
  ) {
    const existingInvoice = await this.findOne(id, familyId);

    // Check if period is still open
    if (existingInvoice.period.status === PeriodStatus.CLOSED) {
      throw new BadRequestException("Cannot update invoice in a closed period");
    }

    const { lines, distributionRules, distributionMethod, ...updateData } =
      updateInvoiceDto;

    // If distribution method or total changes, recalculate shares
    const shouldRecalculateShares =
      updateInvoiceDto.distributionMethod !== undefined ||
      updateInvoiceDto.totalCents !== undefined ||
      updateInvoiceDto.distributionRules !== undefined;

    if (shouldRecalculateShares) {
      const totalCents =
        updateInvoiceDto.totalCents ?? existingInvoice.totalCents;
      const method =
        updateInvoiceDto.distributionMethod ??
        existingInvoice.distributionMethod;

      // Get incomes for period
      const incomes = await this.prisma.income.findMany({
        where: { periodId: existingInvoice.periodId },
        include: { user: true },
      });

      const shares = await this.calculateShares(
        totalCents,
        method,
        distributionRules,
        incomes.map((inc) => ({
          userId: inc.userId,
          userName: inc.user.name,
          normalizedMonthlyGrossCents: inc.normalizedMonthlyGrossCents,
        })),
      );

      // Update in transaction
      return this.prisma.$transaction(async (tx) => {
        // Delete existing shares
        await tx.invoiceShare.deleteMany({
          where: { invoiceId: id },
        });

        // Update invoice and create new shares
        return tx.invoice.update({
          where: { id },
          data: {
            ...updateData,
            ...(updateInvoiceDto.totalCents !== undefined && {
              totalCents: updateInvoiceDto.totalCents,
            }),
            ...(updateInvoiceDto.distributionMethod !== undefined && {
              distributionMethod: updateInvoiceDto.distributionMethod,
            }),
            shares: {
              create: shares.map((share) => ({
                userId: share.userId,
                shareCents: share.shareCents,
                explanation: share.explanation,
              })),
            },
          },
          include: {
            lines: true,
            distribution: true,
            shares: {
              include: {
                user: {
                  select: { id: true, name: true, username: true },
                },
              },
            },
            payments: {
              include: {
                paidBy: {
                  select: { id: true, name: true, username: true },
                },
              },
            },
          },
        });
      });
    }

    // Simple update without recalculation
    return this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        lines: true,
        distribution: true,
        shares: {
          include: {
            user: {
              select: { id: true, name: true, username: true },
            },
          },
        },
        payments: {
          include: {
            paidBy: {
              select: { id: true, name: true, username: true },
            },
          },
        },
      },
    });
  }

  /**
   * Delete an invoice
   */
  async remove(id: string, familyId: string) {
    const invoice = await this.findOne(id, familyId);

    // Check if period is still open
    if (invoice.period.status === PeriodStatus.CLOSED) {
      throw new BadRequestException(
        "Cannot delete invoice from a closed period",
      );
    }

    await this.prisma.invoice.delete({
      where: { id },
    });

    return { message: "Invoice deleted successfully" };
  }

  /**
   * Add a payment to an invoice
   */
  async addPayment(
    invoiceId: string,
    addPaymentDto: AddPaymentDto,
    familyId: string,
  ) {
    const invoice = await this.findOne(invoiceId, familyId);

    // Verify payer belongs to family
    const payer = await this.prisma.user.findFirst({
      where: { id: addPaymentDto.paidById, familyId },
    });

    if (!payer) {
      throw new NotFoundException(`User ${addPaymentDto.paidById} not found`);
    }

    // Calculate current payment total
    const currentPayments = await this.prisma.payment.aggregate({
      where: { invoiceId },
      _sum: { amountCents: true },
    });

    const totalPaid = currentPayments._sum.amountCents || 0;
    const newTotal = totalPaid + addPaymentDto.amountCents;

    if (newTotal > invoice.totalCents) {
      throw new BadRequestException(
        `Payment would exceed invoice total. Invoice: ${invoice.totalCents}, Paid: ${totalPaid}, New: ${addPaymentDto.amountCents}`,
      );
    }

    return this.prisma.payment.create({
      data: {
        invoiceId,
        paidById: addPaymentDto.paidById,
        amountCents: addPaymentDto.amountCents,
        note: addPaymentDto.note,
        paidAt: addPaymentDto.paidAt
          ? new Date(addPaymentDto.paidAt)
          : new Date(),
      },
      include: {
        paidBy: {
          select: { id: true, name: true, username: true },
        },
        invoice: {
          select: {
            id: true,
            vendor: true,
            totalCents: true,
          },
        },
      },
    });
  }

  /**
   * Calculate shares using AllocationService
   */
  private async calculateShares(
    totalCents: number,
    distributionMethod: DistributionMethod,
    distributionRules: any,
    participants: Array<{
      userId: string;
      userName: string;
      normalizedMonthlyGrossCents: number;
    }>,
  ) {
    switch (distributionMethod) {
      case DistributionMethod.BY_PERCENT:
        if (
          !distributionRules?.percentRules ||
          distributionRules.percentRules.length === 0
        ) {
          throw new BadRequestException(
            "Percent rules required for BY_PERCENT distribution",
          );
        }
        return this.allocationService.splitByPercent(
          totalCents,
          distributionRules.percentRules,
        );

      case DistributionMethod.BY_INCOME:
        return this.allocationService.splitByIncome(totalCents, participants);

      case DistributionMethod.FIXED:
        if (
          !distributionRules?.fixedRules ||
          distributionRules.fixedRules.length === 0
        ) {
          throw new BadRequestException(
            "Fixed rules required for FIXED distribution",
          );
        }
        if (!distributionRules.remainderMethod) {
          throw new BadRequestException(
            "Remainder method required for FIXED distribution",
          );
        }
        return this.allocationService.splitFixed(
          totalCents,
          distributionRules.fixedRules,
          distributionRules.remainderMethod,
          participants,
        );

      default:
        throw new BadRequestException(
          `Unsupported distribution method: ${distributionMethod}`,
        );
    }
  }
}
