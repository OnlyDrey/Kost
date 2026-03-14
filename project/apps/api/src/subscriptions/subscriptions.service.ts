import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AllocationService } from "../invoices/allocation.service";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { UpdateSubscriptionDto } from "./dto/update-subscription.dto";
import { DistributionMethod, SubscriptionStatus } from "@kost/shared";
import { toDistributionMethod, toSubscriptionStatus } from "../common/enum-mappers";

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

  async create(
    createSubscriptionDto: CreateSubscriptionDto,
    familyId: string,
    currentUserId: string,
    currentUserRole: string,
  ) {
    const {
      startDate,
      endDate,
      nextBillingAt,
      distributionRules,
      status,
      personalUserId,
      ...subscriptionData
    } = createSubscriptionDto;

    const normalizedStatus = toSubscriptionStatus(status ?? SubscriptionStatus.ACTIVE);

    const isPersonalDistribution =
      createSubscriptionDto.distributionMethod === DistributionMethod.PERSONAL;
    const effectivePersonalUserId = personalUserId ?? undefined;
    if (isPersonalDistribution) {
      if (!effectivePersonalUserId) {
        throw new BadRequestException(
          "personalUserId is required for PERSONAL distribution",
        );
      }
      await this.assertPersonalTargetAllowed(
        familyId,
        currentUserId,
        currentUserRole,
        effectivePersonalUserId,
      );
    }

    return this.prisma.subscription.create({
      data: {
        ...subscriptionData,
        familyId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        nextBillingAt: nextBillingAt
          ? new Date(nextBillingAt)
          : createSubscriptionDto.dayOfMonth
            ? this.buildNextBillingDate(createSubscriptionDto.dayOfMonth)
            : new Date(startDate),
        status: normalizedStatus,
        distributionRules: this.normalizeDistributionRules(
          distributionRules,
          isPersonalDistribution ? effectivePersonalUserId : undefined,
        ) as any,
        isPersonal: isPersonalDistribution,
        ownerUserId: isPersonalDistribution ? effectivePersonalUserId : null,
        active:
          normalizedStatus === SubscriptionStatus.ACTIVE &&
          (createSubscriptionDto.active ?? true),
      } as any,
    });
  }

  async update(
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
    familyId: string,
    currentUserId: string,
    currentUserRole: string,
  ) {
    await this.findOne(id, familyId);

    const {
      startDate,
      endDate,
      nextBillingAt,
      distributionRules,
      status,
      personalUserId,
      ...updateData
    } = updateSubscriptionDto;

    const normalizedStatus = status ? toSubscriptionStatus(status) : undefined;

    const existing = await this.findOne(id, familyId);
    const effectiveMethod = toDistributionMethod(
      updateSubscriptionDto.distributionMethod ?? existing.distributionMethod,
    );
    const isPersonalDistribution =
      effectiveMethod === DistributionMethod.PERSONAL;
    const effectivePersonalUserId = personalUserId ?? undefined;
    if (isPersonalDistribution) {
      if (!effectivePersonalUserId) {
        throw new BadRequestException(
          "personalUserId is required for PERSONAL distribution",
        );
      }
      await this.assertPersonalTargetAllowed(
        familyId,
        currentUserId,
        currentUserRole,
        effectivePersonalUserId,
      );
    }

    return this.prisma.subscription.update({
      where: { id },
      data: {
        ...updateData,
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
        ...(nextBillingAt !== undefined && {
          nextBillingAt: nextBillingAt ? new Date(nextBillingAt) : null,
        }),
        ...(normalizedStatus !== undefined && {
          status: normalizedStatus,
          active: normalizedStatus === SubscriptionStatus.ACTIVE,
        }),
        ...(distributionRules !== undefined && {
          distributionRules: this.normalizeDistributionRules(
            distributionRules,
            isPersonalDistribution ? effectivePersonalUserId : undefined,
          ) as any,
        }),
        ...(updateSubscriptionDto.distributionMethod !== undefined && {
          isPersonal: isPersonalDistribution,
          ownerUserId: isPersonalDistribution ? effectivePersonalUserId : null,
        }),
      },
    });
  }

  async toggleActive(id: string, familyId: string) {
    const subscription = await this.findOne(id, familyId);
    const nextActive = !subscription.active;
    return this.prisma.subscription.update({
      where: { id },
      data: {
        active: nextActive,
        status: nextActive
          ? SubscriptionStatus.ACTIVE
          : SubscriptionStatus.PAUSED,
      },
    });
  }

  async remove(id: string, familyId: string) {
    await this.findOne(id, familyId);
    await this.prisma.subscription.delete({ where: { id } });
    return { message: "Subscription deleted successfully" };
  }

  async generateInvoicesForPeriod(periodId: string, familyId: string) {
    const period = await this.prisma.period.findFirst({
      where: { id: periodId, familyId },
    });
    if (!period) {
      throw new NotFoundException(`Period ${periodId} not found`);
    }
    if (period.status !== "OPEN") {
      throw new BadRequestException(
        "Cannot generate invoices for a closed period",
      );
    }

    const subscriptions = await this.prisma.subscription.findMany({
      where: { familyId, active: true, status: SubscriptionStatus.ACTIVE },
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

    type IncomeWithUser = (typeof incomes)[number];
    type Participant = {
      userId: string;
      userName: string;
      role: string;
      normalizedMonthlyGrossCents: number;
    };

    const allParticipants: Participant[] = incomes.map((inc: IncomeWithUser) => ({
      userId: inc.userId,
      userName: inc.user.name,
      role: inc.user.role,
      normalizedMonthlyGrossCents: inc.normalizedMonthlyGrossCents,
    }));

    const generatedInvoices = [];

    for (const subscription of subscriptions) {
      const startDate = new Date(subscription.startDate);
      const endDate = subscription.endDate
        ? new Date(subscription.endDate)
        : null;

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
          ? allParticipants.filter((p: Participant) =>
              selectedUserIds.includes(p.userId),
            )
          : allParticipants.filter((p: Participant) => p.role !== "CHILD");
      const distributionMethod = toDistributionMethod(
        subscription.distributionMethod,
      );

      const shares = await this.calculateShares(
        subscription.amountCents,
        distributionMethod,
        distributionRules,
        participants,
        subscription.ownerUserId || undefined,
      );

      const invoice = await this.prisma.invoice.create({
        data: {
          familyId,
          periodId,
          category: subscription.category ?? "",
          vendor: subscription.vendor,
          description: `${subscription.name} - ${subscription.frequency}`,
          totalCents: subscription.amountCents,
          distributionMethod,
          paymentMethod: subscription.paymentMethod ?? null,
          isPersonal: distributionMethod === DistributionMethod.PERSONAL,
          ownerUserId:
            distributionMethod === DistributionMethod.PERSONAL
              ? subscription.ownerUserId
              : null,
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

  private normalizeDistributionRules(
    distributionRules: any,
    personalUserId?: string,
  ) {
    const rules = (distributionRules ?? {}) as Record<string, any>;
    const normalized: Record<string, any> = { ...rules };

    if (
      (!Array.isArray(normalized.userIds) || normalized.userIds.length === 0) &&
      Array.isArray(normalized.percentRules)
    ) {
      normalized.userIds = normalized.percentRules.map(
        (rule: any) => rule.userId,
      );
    }

    if (Array.isArray(normalized.userIds)) {
      normalized.userIds = [...new Set(normalized.userIds.filter(Boolean))];
    }

    if (personalUserId) {
      normalized.userIds = [personalUserId];
    }
    return normalized;
  }

  private buildNextBillingDate(dayOfMonth: number) {
    const now = new Date();
    const billing = new Date(
      now.getFullYear(),
      now.getMonth(),
      Math.min(Math.max(dayOfMonth, 1), 28),
    );
    if (billing < now) {
      billing.setMonth(billing.getMonth() + 1);
    }
    return billing;
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
    personalUserId?: string,
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
        if (!distributionRules?.fixedRules?.length) {
          if (participants.length === 0) {
            throw new BadRequestException("No participants for equal split.");
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
          "Adults can only assign personal recurring expenses to self or children",
        );
      }
      return;
    }
    if (personalUserId !== currentUserId) {
      throw new ForbiddenException(
        "Children can only assign personal recurring expenses to self",
      );
    }
  }
}
