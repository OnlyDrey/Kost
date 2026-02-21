import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AllocationService } from "../invoices/allocation.service";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { UpdateSubscriptionDto } from "./dto/update-subscription.dto";
import { DistributionMethod } from "@prisma/client";

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private allocationService: AllocationService,
  ) {}

  async findAll(familyId: string, activeOnly = false) {
    return this.prisma.subscription.findMany({
      where: {
        familyId,
        ...(activeOnly && { active: true }),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findActive(familyId: string) {
    return this.findAll(familyId, true);
  }

  async findOne(id: string, familyId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id, familyId },
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }
    return subscription;
  }

  async create(createSubscriptionDto: CreateSubscriptionDto, familyId: string) {
    const { startDate, endDate, distributionRules, ...subscriptionData } =
      createSubscriptionDto;

    return this.prisma.subscription.create({
      data: {
        ...subscriptionData,
        familyId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        distributionRules: (distributionRules ?? {}) as any,
        active: createSubscriptionDto.active ?? true,
      },
    });
  }

  async update(
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
    familyId: string,
  ) {
    await this.findOne(id, familyId);

    const { startDate, endDate, distributionRules, ...updateData } =
      updateSubscriptionDto;

    return this.prisma.subscription.update({
      where: { id },
      data: {
        ...updateData,
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
        ...(distributionRules !== undefined && {
          distributionRules: distributionRules as any,
        }),
      },
    });
  }

  async toggleActive(id: string, familyId: string) {
    const subscription = await this.findOne(id, familyId);
    return this.prisma.subscription.update({
      where: { id },
      data: { active: !subscription.active },
    });
  }

  async remove(id: string, familyId: string) {
    await this.findOne(id, familyId);
    await this.prisma.subscription.delete({ where: { id } });
    return { message: "Subscription deleted successfully" };
  }

  async generateInvoicesForPeriod(periodId: string, familyId: string) {
    const period = await this.prisma.period.findFirst({
      where: { id: periodId, familyId, status: "OPEN" },
    });
    if (!period) {
      throw new NotFoundException(`Open period ${periodId} not found`);
    }

    const subscriptions = await this.prisma.subscription.findMany({
      where: { familyId, active: true },
    });

    const [year, month] = periodId.split("-").map(Number);
    const periodDate = new Date(year, month - 1, 1);

    const incomes = await this.prisma.income.findMany({
      where: { periodId },
      include: { user: true },
    });

    if (incomes.length === 0) {
      throw new BadRequestException(
        "No incomes found for period. Add incomes first.",
      );
    }

    const allParticipants = incomes.map((inc) => ({
      userId: inc.userId,
      userName: inc.user.name,
      role: inc.user.role,
      normalizedMonthlyGrossCents: inc.normalizedMonthlyGrossCents,
    }));

    const generatedInvoices = [];

    for (const subscription of subscriptions) {
      const startDate = new Date(subscription.startDate);
      const endDate = subscription.endDate ? new Date(subscription.endDate) : null;

      if (startDate > periodDate) continue;
      if (endDate && endDate < periodDate) continue;

      const existingInvoice = await this.prisma.invoice.findFirst({
        where: {
          periodId,
          familyId,
          vendor: subscription.vendor,
          description: { contains: subscription.name },
        },
      });
      if (existingInvoice) continue;

      const distributionRules = subscription.distributionRules as any;
      const selectedUserIds = distributionRules?.userIds;
      const participants =
        selectedUserIds && selectedUserIds.length > 0
          ? allParticipants.filter((p) => selectedUserIds.includes(p.userId))
          : allParticipants.filter((p) => p.role !== "JUNIOR");

      const shares = await this.calculateShares(
        subscription.amountCents,
        subscription.distributionMethod,
        distributionRules,
        participants,
      );

      const invoice = await this.prisma.invoice.create({
        data: {
          familyId,
          periodId,
          category: subscription.category ?? "",
          vendor: subscription.vendor,
          description: `${subscription.name} - ${subscription.frequency}`,
          totalCents: subscription.amountCents,
          distributionMethod: subscription.distributionMethod,
          shares: {
            create: shares.map((share) => ({
              userId: share.userId,
              shareCents: share.shareCents,
              explanation: share.explanation,
            })),
          },
        },
      });

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { lastGenerated: new Date() },
      });

      generatedInvoices.push(invoice);
    }

    return {
      message: `Generated ${generatedInvoices.length} invoices from subscriptions`,
      invoices: generatedInvoices,
    };
  }

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
        if (!distributionRules?.percentRules?.length) {
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
        if (!distributionRules?.fixedRules?.length) {
          if (participants.length === 0) {
            throw new BadRequestException(
              "No participants for equal split.",
            );
          }
          return this.allocationService.splitEqual(totalCents, participants);
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
