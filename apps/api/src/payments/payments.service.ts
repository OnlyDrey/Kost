import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all payments for a period
   */
  async findByPeriod(periodId: string, familyId: string) {
    // Verify period belongs to family
    const period = await this.prisma.period.findFirst({
      where: { id: periodId, familyId },
    });

    if (!period) {
      throw new NotFoundException(`Period ${periodId} not found`);
    }

    return this.prisma.payment.findMany({
      where: {
        invoice: {
          periodId,
          familyId,
        },
      },
      include: {
        paidBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        invoice: {
          select: {
            id: true,
            vendor: true,
            category: true,
            totalCents: true,
            description: true,
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });
  }

  /**
   * Get all payments made by a specific user
   */
  async findByUser(userId: string, familyId: string, periodId?: string) {
    // Verify user belongs to family
    const user = await this.prisma.user.findFirst({
      where: { id: userId, familyId },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    return this.prisma.payment.findMany({
      where: {
        paidById: userId,
        ...(periodId && {
          invoice: {
            periodId,
            familyId,
          },
        }),
      },
      include: {
        invoice: {
          select: {
            id: true,
            vendor: true,
            category: true,
            totalCents: true,
            description: true,
            periodId: true,
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });
  }

  /**
   * Get a specific payment by ID
   */
  async findOne(id: string, familyId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id,
        invoice: {
          familyId,
        },
      },
      include: {
        paidBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        invoice: {
          include: {
            shares: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  /**
   * Get payment summary for a user in a period
   */
  async getUserPaymentSummary(userId: string, periodId: string, familyId: string) {
    // Verify user belongs to family
    const user = await this.prisma.user.findFirst({
      where: { id: userId, familyId },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Verify period belongs to family
    const period = await this.prisma.period.findFirst({
      where: { id: periodId, familyId },
    });

    if (!period) {
      throw new NotFoundException(`Period ${periodId} not found`);
    }

    // Get total amount user has paid
    const totalPaid = await this.prisma.payment.aggregate({
      where: {
        paidById: userId,
        invoice: {
          periodId,
          familyId,
        },
      },
      _sum: {
        amountCents: true,
      },
    });

    // Get total amount user owes (their shares)
    const totalOwed = await this.prisma.invoiceShare.aggregate({
      where: {
        userId,
        invoice: {
          periodId,
          familyId,
        },
      },
      _sum: {
        shareCents: true,
      },
    });

    const paid = totalPaid._sum.amountCents || 0;
    const owed = totalOwed._sum.shareCents || 0;
    const balance = paid - owed;

    return {
      userId,
      userName: user.name,
      periodId,
      totalPaidCents: paid,
      totalOwedCents: owed,
      balanceCents: balance,
      status: balance >= 0 ? 'settled' : 'owing',
    };
  }

  /**
   * Get payment summary for all users in a period
   */
  async getPeriodPaymentSummary(periodId: string, familyId: string) {
    // Verify period belongs to family
    const period = await this.prisma.period.findFirst({
      where: { id: periodId, familyId },
    });

    if (!period) {
      throw new NotFoundException(`Period ${periodId} not found`);
    }

    // Get all users with incomes in this period
    const incomes = await this.prisma.income.findMany({
      where: { periodId },
      include: {
        user: true,
      },
    });

    const summaries = await Promise.all(
      incomes.map((income) =>
        this.getUserPaymentSummary(income.userId, periodId, familyId),
      ),
    );

    return {
      periodId,
      users: summaries,
      totalInvoicesCents: summaries.reduce((sum, s) => {
        // Only count each user's owed amount once
        return sum;
      }, 0),
    };
  }

  /**
   * Delete a payment (Admin operation, typically not exposed)
   */
  async remove(id: string, familyId: string) {
    const payment = await this.findOne(id, familyId);

    await this.prisma.payment.delete({
      where: { id },
    });

    return { message: 'Payment deleted successfully' };
  }
}
