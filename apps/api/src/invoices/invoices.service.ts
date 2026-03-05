import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AllocationService } from "./allocation.service";
import { CreateInvoiceDto, DistributionMethod } from "./dto/create-invoice.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";
import { AddPaymentDto } from "./dto/add-payment.dto";
import { PeriodStatus } from "@kost/shared";
import type { Prisma } from "@prisma/client";

const apiError = (code: string, message: string) => ({ code, message });

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private allocationService: AllocationService,
  ) {}

  private toParticipant(income: {
    userId: string;
    user: { name: string; role: string };
    normalizedMonthlyGrossCents: number;
  }) {
    return {
      userId: income.userId,
      userName: income.user.name,
      role: income.user.role,
      normalizedMonthlyGrossCents: income.normalizedMonthlyGrossCents,
    };
  }

  /**
   * Get all invoices for a period
   */
  async findByPeriod(
    periodId: string,
    familyId: string,
    currentUserId: string,
  ) {
    // Verify period belongs to family
    const period = await this.prisma.period.findFirst({
      where: { id: periodId, familyId },
    });

    if (!period) {
      throw new NotFoundException(`Period ${periodId} not found`);
    }

    return this.prisma.invoice.findMany({
      where: {
        periodId,
        familyId,
        OR: [
          { isPersonal: false },
          { ownerUserId: currentUserId },
          { isPersonal: true, ownerUserId: null },
        ],
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
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get a specific invoice by ID
   */
  async findOne(id: string, familyId: string, currentUserId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        familyId,
        OR: [
          { isPersonal: false },
          { ownerUserId: currentUserId },
          { isPersonal: true, ownerUserId: null },
        ],
      },
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
  async create(
    createInvoiceDto: CreateInvoiceDto,
    familyId: string,
    currentUserId: string,
    currentUserRole: string,
  ) {
    const {
      periodId,
      distributionMethod,
      lines,
      distributionRules,
      isPersonal,
      personalUserId,
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

    const isPersonalDistribution =
      distributionMethod === DistributionMethod.PERSONAL || !!isPersonal;
    const personalTargetUserId =
      personalUserId || (isPersonal ? currentUserId : null);

    if (isPersonalDistribution) {
      if (!personalTargetUserId) {
        throw new BadRequestException(
          "personalUserId is required for PERSONAL distribution",
        );
      }
      await this.assertPersonalTargetAllowed(
        familyId,
        currentUserId,
        currentUserRole,
        personalTargetUserId,
      );
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

    const selectedUserIds = distributionRules?.userIds;

    let allParticipants: Array<{
      userId: string;
      userName: string;
      role: string;
      normalizedMonthlyGrossCents: number;
    }>;
    let participants: Array<{
      userId: string;
      userName: string;
      role: string;
      normalizedMonthlyGrossCents: number;
    }>;

    if (isPersonalDistribution) {
      allParticipants = [];
      participants = [];
    }
    // If specific users are selected (including manual child selection), include them even without incomes
    else if (selectedUserIds && selectedUserIds.length > 0) {
      // When users are explicitly selected, we need to include them even if they don't have incomes
      // This allows manually selecting children (CHILD users) for expense distribution
      const incomesMap = new Map(incomes.map((inc: (typeof incomes)[number]) => [inc.userId, inc]));
      const allFamily = await this.prisma.user.findMany({
        where: { familyId },
      });

      allParticipants = selectedUserIds.map((userId) => {
        const income = incomesMap.get(userId);
        const user = allFamily.find((u: (typeof allFamily)[number]) => u.id === userId);

        if (!user) {
          throw new BadRequestException(`User ${userId} not found in family`);
        }

        return {
          userId: user.id,
          userName: user.name,
          role: user.role,
          normalizedMonthlyGrossCents:
            (income as (typeof incomes)[number] | undefined)?.normalizedMonthlyGrossCents ?? 0,
        };
      });

      // For FIXED distribution or explicit percent/fixed rules, we can proceed without income users
      // For other methods using default allocation, validate at least one user has income
      if (
        distributionMethod !== "FIXED" &&
        distributionMethod !== "BY_PERCENT" &&
        !distributionRules?.fixedRules
      ) {
        const hasIncome = allParticipants.some(
          (p) => p.normalizedMonthlyGrossCents > 0,
        );
        if (!hasIncome) {
          throw new BadRequestException(
            "At least one selected user must have income for this distribution method",
          );
        }
      }

      participants = allParticipants;
    } else {
      // Default behavior: use users with incomes, excluding CHILD users
      // However, if explicit percentRules or fixedRules are provided, we can use selected users even without incomes
      if (
        incomes.length === 0 &&
        !distributionRules?.percentRules &&
        !distributionRules?.fixedRules
      ) {
        throw new BadRequestException(
          "No users with income found for this period. Add incomes first.",
        );
      }

      if (incomes.length > 0) {
        allParticipants = incomes.map((inc: (typeof incomes)[number]) => this.toParticipant(inc));
        participants = allParticipants.filter((p) => p.role !== "CHILD");
      } else {
        // No incomes found, but explicit rules provided - use an empty participants list
        // This will be sufficient for splitByPercent or splitFixed
        allParticipants = [];
        participants = [];
      }
    }

    // Calculate shares based on distribution method
    const shares = await this.calculateShares(
      createInvoiceDto.totalCents,
      distributionMethod,
      distributionRules,
      participants,
      personalTargetUserId || undefined,
    );

    // Create invoice with lines, distribution rules, and shares in a transaction
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const invoice = await tx.invoice.create({
        data: {
          familyId,
          periodId,
          category: invoiceData.category ?? "",
          vendor: invoiceData.vendor,
          description: invoiceData.description,
          dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : null,
          totalCents: createInvoiceDto.totalCents,
          distributionMethod: isPersonalDistribution
            ? DistributionMethod.PERSONAL
            : distributionMethod,
          paymentMethod: invoiceData.paymentMethod ?? null,
          isPersonal: isPersonalDistribution,
          ownerUserId: isPersonalDistribution ? personalTargetUserId : null,
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
    currentUserId: string,
    currentUserRole: string,
  ) {
    const existingInvoice = await this.findOne(id, familyId, currentUserId);

    // Check if period is still open
    if (existingInvoice.period.status === PeriodStatus.CLOSED) {
      throw new BadRequestException(
        apiError("PERIOD_CLOSED", "Cannot update invoice in a closed period"),
      );
    }

    const {
      periodId,
      lines,
      distributionMethod,
      distributionRules,
      dueDate,
      ...restUpdateData
    } = updateInvoiceDto;

    void periodId;
    void lines;
    void distributionMethod;

    // Convert dueDate string to Date object (Prisma requires ISO-8601 DateTime)
    const updateData = {
      ...restUpdateData,
      ...(dueDate !== undefined && {
        dueDate: dueDate ? new Date(dueDate) : null,
      }),
      ...(updateInvoiceDto.personalUserId !== undefined && {
        ownerUserId: updateInvoiceDto.personalUserId || null,
      }),
      ...(updateInvoiceDto.distributionMethod !== undefined && {
        isPersonal:
          updateInvoiceDto.distributionMethod === DistributionMethod.PERSONAL,
      }),
      ...(updateInvoiceDto.isPersonal !== undefined && {
        isPersonal: updateInvoiceDto.isPersonal,
        ownerUserId: updateInvoiceDto.isPersonal ? currentUserId : null,
      }),
    };

    if (
      existingInvoice.isPersonal &&
      existingInvoice.ownerUserId !== currentUserId
    ) {
      throw new ForbiddenException(
        "You can only update your own personal expenses",
      );
    }

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

      // Filter participants by selected userIds (same logic as create)
      const selectedUserIds = distributionRules?.userIds;
      let allParticipants: Array<{
        userId: string;
        userName: string;
        role: string;
        normalizedMonthlyGrossCents: number;
      }>;
      let participants: Array<{
        userId: string;
        userName: string;
        role: string;
        normalizedMonthlyGrossCents: number;
      }>;

      if (selectedUserIds && selectedUserIds.length > 0) {
        // When users are explicitly selected, include them even if they don't have incomes
        const incomesMap = new Map(incomes.map((inc: (typeof incomes)[number]) => [inc.userId, inc]));
        const allFamily = await this.prisma.user.findMany({
          where: { familyId },
        });

        allParticipants = selectedUserIds.map((userId) => {
          const income = incomesMap.get(userId);
          const user = allFamily.find((u: (typeof allFamily)[number]) => u.id === userId);

          if (!user) {
            throw new BadRequestException(`User ${userId} not found in family`);
          }

          return {
            userId: user.id,
            userName: user.name,
            role: user.role,
            normalizedMonthlyGrossCents:
              (income as (typeof incomes)[number] | undefined)
                ?.normalizedMonthlyGrossCents ?? 0,
          };
        });

        // For FIXED distribution, we can proceed even with no income users
        // For other methods, validate at least one user has income
        if (method !== "FIXED" && method !== DistributionMethod.PERSONAL) {
          const hasIncome = allParticipants.some(
            (p) => p.normalizedMonthlyGrossCents > 0,
          );
          if (!hasIncome) {
            throw new BadRequestException(
              "At least one selected user must have income for this distribution method",
            );
          }
        }

        participants = allParticipants;
      } else {
        // Default behavior: use users with incomes, excluding CHILD users
        allParticipants = incomes.map((inc: (typeof incomes)[number]) => this.toParticipant(inc));
        participants = allParticipants.filter((p) => p.role !== "CHILD");
      }

      const personalTargetUserId =
        updateInvoiceDto.personalUserId ??
        existingInvoice.ownerUserId ??
        undefined;
      if (method === DistributionMethod.PERSONAL) {
        if (!personalTargetUserId) {
          throw new BadRequestException(
            "personalUserId is required for PERSONAL distribution",
          );
        }
        await this.assertPersonalTargetAllowed(
          familyId,
          currentUserId,
          currentUserRole,
          personalTargetUserId,
        );
      }

      const shares = await this.calculateShares(
        totalCents,
        method,
        distributionRules,
        participants,
        personalTargetUserId,
      );

      // Update in transaction
      return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
            ...(updateInvoiceDto.personalUserId !== undefined && {
              ownerUserId: updateInvoiceDto.personalUserId,
              isPersonal:
                (updateInvoiceDto.distributionMethod ??
                  existingInvoice.distributionMethod) ===
                DistributionMethod.PERSONAL,
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
  async remove(id: string, familyId: string, currentUserId: string) {
    const invoice = await this.findOne(id, familyId, currentUserId);

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
    currentUserId: string,
  ) {
    const invoice = await this.findOne(invoiceId, familyId, currentUserId);

    if (invoice.period.status !== PeriodStatus.OPEN) {
      throw new BadRequestException(
        apiError(
          "PERIOD_CLOSED",
          "Cannot add payment to an invoice in a closed period",
        ),
      );
    }

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
        apiError(
          "PAYMENT_EXCEEDS_TOTAL",
          `Payment would exceed invoice total. Invoice: ${invoice.totalCents}, Paid: ${totalPaid}, New: ${addPaymentDto.amountCents}`,
        ),
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
    personalUserId?: string,
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

      case DistributionMethod.PERSONAL:
        if (!personalUserId) {
          throw new BadRequestException(
            "personalUserId is required for PERSONAL distribution",
          );
        }
        return [
          {
            userId: personalUserId,
            shareCents: totalCents,
            explanation: "Personal expense",
          },
        ];

      case DistributionMethod.FIXED:
        // No fixedRules → equal split among participants (selected via userIds)
        if (
          !distributionRules?.fixedRules ||
          distributionRules.fixedRules.length === 0
        ) {
          if (participants.length === 0) {
            throw new BadRequestException(
              "No participants for equal split. Select at least one user.",
            );
          }
          return this.allocationService.splitEqual(totalCents, participants);
        }
        if (!distributionRules.remainderMethod) {
          throw new BadRequestException(
            "Remainder method required for FIXED distribution with fixed rules",
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

  private async assertPersonalTargetAllowed(
    familyId: string,
    currentUserId: string,
    currentUserRole: string,
    personalUserId: string,
  ) {
    const target = await this.prisma.user.findFirst({
      where: { id: personalUserId, familyId },
    });
    if (!target)
      throw new BadRequestException(
        "Selected personal user not found in family",
      );

    if (currentUserRole === "ADMIN") return;
    if (currentUserRole === "ADULT") {
      if (personalUserId !== currentUserId && target.role !== "CHILD") {
        throw new ForbiddenException(
          "Adults can only assign personal expenses to self or children",
        );
      }
      return;
    }

    if (personalUserId !== currentUserId) {
      throw new ForbiddenException(
        "Children can only assign personal expenses to self",
      );
    }
  }
}
