import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePeriodDto } from "./dto/create-period.dto";
import { PeriodStatus } from "@prisma/client";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";

@Injectable()
export class PeriodsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => SubscriptionsService))
    private subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * Get all periods for a family
   */
  async findAll(familyId: string) {
    return this.prisma.period.findMany({
      where: { familyId },
      orderBy: { id: "desc" },
      include: {
        _count: {
          select: {
            invoices: true,
            incomes: true,
          },
        },
      },
    });
  }

  /**
   * Get a specific period by ID
   */
  async findOne(id: string, familyId: string) {
    const period = await this.prisma.period.findFirst({
      where: { id, familyId },
      include: {
        invoices: {
          include: {
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
        },
        incomes: {
          include: {
            user: {
              select: { id: true, name: true, username: true, role: true },
            },
          },
        },
        _count: {
          select: {
            invoices: true,
            incomes: true,
          },
        },
      },
    });

    if (!period) {
      throw new NotFoundException(`Period with ID ${id} not found`);
    }

    return period;
  }

  /**
   * Get the current open period (latest open period)
   */
  async getCurrentPeriod(familyId: string) {
    const period = await this.prisma.period.findFirst({
      where: { familyId, status: PeriodStatus.OPEN },
      orderBy: { id: "desc" },
      include: {
        _count: {
          select: {
            invoices: true,
            incomes: true,
          },
        },
      },
    });

    if (!period) {
      throw new NotFoundException("No open period found");
    }

    return period;
  }

  /**
   * Create a new period
   */
  async create(createPeriodDto: CreatePeriodDto, familyId: string) {
    // Validate period ID format (YYYY-MM)
    const periodIdRegex = /^\d{4}-\d{2}$/;
    if (!periodIdRegex.test(createPeriodDto.id)) {
      throw new ConflictException("Period ID must be in YYYY-MM format");
    }

    // Check if period already exists
    const existingPeriod = await this.prisma.period.findFirst({
      where: { id: createPeriodDto.id, familyId },
    });

    if (existingPeriod) {
      throw new ConflictException(
        `Period ${createPeriodDto.id} already exists`,
      );
    }

    // Create the new period
    const newPeriod = await this.prisma.period.create({
      data: {
        id: createPeriodDto.id,
        familyId,
        status: PeriodStatus.OPEN,
      },
      include: {
        _count: {
          select: {
            invoices: true,
            incomes: true,
          },
        },
      },
    });

    // Copy incomes from the previous period if it exists
    await this.copyIncomesFromPreviousPeriod(createPeriodDto.id, familyId);

    // Generate invoices from active subscriptions if incomes exist
    try {
      const incomesCount = await this.prisma.income.count({
        where: { periodId: createPeriodDto.id },
      });

      if (incomesCount > 0) {
        await this.subscriptionsService.generateInvoicesForPeriod(
          createPeriodDto.id,
          familyId,
        );
      }
    } catch (err) {
      // Silently fail if invoice generation fails - incomes were still copied
      // This allows users to generate invoices manually later
      console.error(
        `Failed to generate invoices for period ${createPeriodDto.id}:`,
        err,
      );
    }

    return newPeriod;
  }

  /**
   * Copy incomes from the previous period to the new period
   */
  private async copyIncomesFromPreviousPeriod(
    newPeriodId: string,
    familyId: string,
  ) {
    // Extract year and month from the new period ID
    const [year, month] = newPeriodId.split("-").map(Number);

    // Calculate previous month
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear -= 1;
    }

    const prevPeriodId = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;

    // Find the previous period
    const previousPeriod = await this.prisma.period.findFirst({
      where: { id: prevPeriodId, familyId },
      include: { incomes: true },
    });

    if (!previousPeriod || previousPeriod.incomes.length === 0) {
      return; // No previous period or no incomes to copy
    }

    // Copy incomes from previous period to new period
    for (const income of previousPeriod.incomes) {
      try {
        await this.prisma.income.create({
          data: {
            userId: income.userId,
            periodId: newPeriodId,
            inputType: income.inputType,
            inputCents: income.inputCents,
            normalizedMonthlyGrossCents: income.normalizedMonthlyGrossCents,
          },
        });
      } catch (err) {
        // Income might already exist, skip it
        continue;
      }
    }
  }

  /**
   * Get period status and statistics
   */
  async getPeriodStatus(id: string, familyId: string) {
    const period = await this.findOne(id, familyId);

    // Calculate totals
    const totalInvoicesCents = period.invoices.reduce(
      (sum, inv) => sum + inv.totalCents,
      0,
    );

    const totalPaidCents = period.invoices.reduce((sum, inv) => {
      const invoicePayments = inv.payments.reduce(
        (pSum, p) => pSum + p.amountCents,
        0,
      );
      return sum + invoicePayments;
    }, 0);

    const totalUnpaidCents = totalInvoicesCents - totalPaidCents;

    // Get user summaries
    const userSummaries = new Map<
      string,
      {
        userId: string;
        userName: string;
        totalOwedCents: number;
        totalPaidCents: number;
        balanceCents: number;
      }
    >();

    // Initialize with users who have incomes
    period.incomes.forEach((income) => {
      userSummaries.set(income.userId, {
        userId: income.userId,
        userName: income.user.name,
        totalOwedCents: 0,
        totalPaidCents: 0,
        balanceCents: 0,
      });
    });

    // Calculate owed amounts
    period.invoices.forEach((invoice) => {
      invoice.shares.forEach((share) => {
        const summary = userSummaries.get(share.userId);
        if (summary) {
          summary.totalOwedCents += share.shareCents;
        }
      });
    });

    // Calculate paid amounts
    period.invoices.forEach((invoice) => {
      invoice.payments.forEach((payment) => {
        const summary = userSummaries.get(payment.paidById);
        if (summary) {
          summary.totalPaidCents += payment.amountCents;
        }
      });
    });

    // Calculate balances
    userSummaries.forEach((summary) => {
      summary.balanceCents = summary.totalPaidCents - summary.totalOwedCents;
    });

    return {
      periodId: period.id,
      status: period.status,
      closedAt: period.closedAt,
      closedBy: period.closedBy,
      stats: {
        totalInvoicesCents,
        totalPaidCents,
        totalUnpaidCents,
        invoiceCount: period.invoices.length,
        userCount: period.incomes.length,
      },
      userSummaries: Array.from(userSummaries.values()),
      settlementData: period.settlementData,
    };
  }

  /**
   * Get period stats in the shape the frontend PeriodStats interface expects
   */
  async getPeriodStats(id: string, familyId: string) {
    const period = await this.findOne(id, familyId);

    const totalAmountCents = period.invoices.reduce(
      (sum, inv) => sum + inv.totalCents,
      0,
    );

    const userShareMap = new Map<string, { userId: string; userName: string; totalShareCents: number }>();

    period.invoices.forEach((invoice) => {
      invoice.shares.forEach((share) => {
        const existing = userShareMap.get(share.userId);
        if (existing) {
          existing.totalShareCents += share.shareCents;
        } else {
          userShareMap.set(share.userId, {
            userId: share.userId,
            userName: share.user.name,
            totalShareCents: share.shareCents,
          });
        }
      });
    });

    return {
      totalInvoices: period.invoices.length,
      totalAmountCents,
      userShares: Array.from(userShareMap.values()),
    };
  }

  /**
   * Get deletion info for a period (what will be deleted)
   */
  async getDeletionInfo(id: string, familyId: string) {
    const period = await this.findOne(id, familyId);
    return {
      periodId: id,
      invoiceCount: period._count.invoices,
      incomeCount: period._count.incomes,
    };
  }

  /**
   * Delete a period and cascade delete all related invoices and incomes
   */
  async remove(id: string, familyId: string) {
    const period = await this.findOne(id, familyId);

    // Delete all related data in transaction
    await this.prisma.$transaction([
      // Delete payments associated with invoices
      this.prisma.payment.deleteMany({
        where: {
          invoice: {
            periodId: id,
            familyId,
          },
        },
      }),
      // Delete shares associated with invoices
      this.prisma.invoiceShare.deleteMany({
        where: {
          invoice: {
            periodId: id,
            familyId,
          },
        },
      }),
      // Delete invoices
      this.prisma.invoice.deleteMany({
        where: { periodId: id, familyId },
      }),
      // Delete incomes
      this.prisma.income.deleteMany({
        where: { periodId: id },
      }),
      // Delete period
      this.prisma.period.delete({
        where: { id },
      }),
    ]);

    return {
      message: "Period deleted successfully",
      deletedInvoices: period._count.invoices,
      deletedIncomes: period._count.incomes,
    };
  }
}
