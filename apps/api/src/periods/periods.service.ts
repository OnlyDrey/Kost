import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePeriodDto } from "./dto/create-period.dto";
import { PeriodStatus } from "@prisma/client";

@Injectable()
export class PeriodsService {
  constructor(private prisma: PrismaService) {}

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
                  select: { id: true, name: true, email: true },
                },
              },
            },
            payments: {
              include: {
                paidBy: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
        incomes: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
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

    return this.prisma.period.create({
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
   * Delete a period (must be empty)
   */
  async remove(id: string, familyId: string) {
    const period = await this.findOne(id, familyId);

    // Check if period has any invoices or incomes
    if (period._count.invoices > 0 || period._count.incomes > 0) {
      throw new ConflictException(
        "Cannot delete period with invoices or incomes. Delete them first.",
      );
    }

    await this.prisma.period.delete({
      where: { id },
    });

    return { message: "Period deleted successfully" };
  }
}
