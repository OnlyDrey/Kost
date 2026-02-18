import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PeriodStatus } from "@prisma/client";

interface SettlementData {
  totalInvoicesCents: number;
  userBalances: Array<{
    userId: string;
    userName: string;
    totalOwedCents: number;
    totalPaidCents: number;
    balanceCents: number;
  }>;
  settlements: Array<{
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    amountCents: number;
  }>;
}

@Injectable()
export class PeriodClosingService {
  private readonly logger = new Logger(PeriodClosingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Close a period and calculate settlements
   */
  async closePeriod(
    periodId: string,
    familyId: string,
    closedBy: string,
  ): Promise<any> {
    const period = await this.prisma.period.findFirst({
      where: { id: periodId, familyId },
      include: {
        invoices: {
          include: {
            shares: true,
            payments: true,
          },
        },
        incomes: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!period) {
      throw new BadRequestException(`Period ${periodId} not found`);
    }

    if (period.status === PeriodStatus.CLOSED) {
      throw new BadRequestException("Period is already closed");
    }

    // Calculate settlement data
    const settlementData = await this.calculateSettlements(period);

    // Update period status
    const updatedPeriod = await this.prisma.period.update({
      where: { id: periodId },
      data: {
        status: PeriodStatus.CLOSED,
        closedAt: new Date(),
        closedBy,
        settlementData: settlementData as any,
      },
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
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    this.logger.log(`Period ${periodId} closed by user ${closedBy}`);

    return {
      period: updatedPeriod,
      settlement: settlementData,
    };
  }

  /**
   * Reopen a closed period (Admin only)
   */
  async reopenPeriod(periodId: string, familyId: string): Promise<any> {
    const period = await this.prisma.period.findFirst({
      where: { id: periodId, familyId },
    });

    if (!period) {
      throw new BadRequestException(`Period ${periodId} not found`);
    }

    if (period.status === PeriodStatus.OPEN) {
      throw new BadRequestException("Period is already open");
    }

    const updatedPeriod = await this.prisma.period.update({
      where: { id: periodId },
      data: {
        status: PeriodStatus.OPEN,
        closedAt: null,
        closedBy: null,
        settlementData: null,
      },
      include: {
        invoices: true,
        incomes: true,
      },
    });

    this.logger.log(`Period ${periodId} reopened`);

    return updatedPeriod;
  }

  /**
   * Calculate settlements between users using a greedy algorithm
   */
  private async calculateSettlements(period: any): Promise<SettlementData> {
    const userBalances = new Map<
      string,
      { userName: string; totalOwed: number; totalPaid: number }
    >();

    // Initialize balances for all users with incomes
    period.incomes.forEach((income: any) => {
      userBalances.set(income.userId, {
        userName: income.user.name,
        totalOwed: 0,
        totalPaid: 0,
      });
    });

    // Calculate what each user owes (their shares)
    period.invoices.forEach((invoice: any) => {
      invoice.shares.forEach((share: any) => {
        const balance = userBalances.get(share.userId);
        if (balance) {
          balance.totalOwed += share.shareCents;
        }
      });
    });

    // Calculate what each user has paid
    period.invoices.forEach((invoice: any) => {
      invoice.payments.forEach((payment: any) => {
        const balance = userBalances.get(payment.paidById);
        if (balance) {
          balance.totalPaid += payment.amountCents;
        }
      });
    });

    // Calculate total invoices
    const totalInvoicesCents = period.invoices.reduce(
      (sum: number, inv: any) => sum + inv.totalCents,
      0,
    );

    // Create user balance array
    const userBalanceArray = Array.from(userBalances.entries()).map(
      ([userId, balance]) => ({
        userId,
        userName: balance.userName,
        totalOwedCents: balance.totalOwed,
        totalPaidCents: balance.totalPaid,
        balanceCents: balance.totalPaid - balance.totalOwed,
      }),
    );

    // Calculate settlements using greedy algorithm
    const settlements = this.calculateGreedySettlements(userBalanceArray);

    return {
      totalInvoicesCents,
      userBalances: userBalanceArray,
      settlements,
    };
  }

  /**
   * Greedy settlement algorithm
   * Matches largest creditor with largest debtor
   */
  private calculateGreedySettlements(
    userBalances: Array<{
      userId: string;
      userName: string;
      balanceCents: number;
    }>,
  ): Array<{
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    amountCents: number;
  }> {
    const settlements: Array<{
      fromUserId: string;
      fromUserName: string;
      toUserId: string;
      toUserName: string;
      amountCents: number;
    }> = [];

    // Create working copy with balances
    const balances = userBalances.map((ub) => ({
      ...ub,
      balance: ub.balanceCents,
    }));

    // Separate debtors (negative balance) and creditors (positive balance)
    while (true) {
      const debtors = balances.filter((b) => b.balance < -1); // Allow 1 cent tolerance
      const creditors = balances.filter((b) => b.balance > 1);

      if (debtors.length === 0 || creditors.length === 0) {
        break;
      }

      // Sort to get largest debtor and largest creditor
      debtors.sort((a, b) => a.balance - b.balance); // Most negative first
      creditors.sort((a, b) => b.balance - a.balance); // Most positive first

      const debtor = debtors[0];
      const creditor = creditors[0];

      // Calculate settlement amount
      const settlementAmount = Math.min(
        Math.abs(debtor.balance),
        creditor.balance,
      );

      settlements.push({
        fromUserId: debtor.userId,
        fromUserName: debtor.userName,
        toUserId: creditor.userId,
        toUserName: creditor.userName,
        amountCents: settlementAmount,
      });

      // Update balances
      debtor.balance += settlementAmount;
      creditor.balance -= settlementAmount;
    }

    return settlements;
  }
}
