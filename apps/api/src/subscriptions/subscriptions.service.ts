import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { UpdateSubscriptionDto } from "./dto/update-subscription.dto";

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all subscriptions for a family
   */
  async findAll(familyId: string, activeOnly = false) {
    return this.prisma.subscription.findMany({
      where: {
        familyId,
        ...(activeOnly && { active: true }),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get active subscriptions
   */
  async findActive(familyId: string) {
    return this.findAll(familyId, true);
  }

  /**
   * Get a specific subscription by ID
   */
  async findOne(id: string, familyId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id, familyId },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return subscription;
  }

  /**
   * Create a new subscription
   */
  async create(createSubscriptionDto: CreateSubscriptionDto, familyId: string) {
    const { startDate, endDate, distributionRules, ...subscriptionData } =
      createSubscriptionDto;

    return this.prisma.subscription.create({
      data: {
        ...subscriptionData,
        familyId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        distributionRules: distributionRules as any,
        active: createSubscriptionDto.active ?? true,
      },
    });
  }

  /**
   * Update a subscription
   */
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
        ...(distributionRules && {
          distributionRules: distributionRules as any,
        }),
      },
    });
  }

  /**
   * Toggle subscription active status
   */
  async toggleActive(id: string, familyId: string) {
    const subscription = await this.findOne(id, familyId);

    return this.prisma.subscription.update({
      where: { id },
      data: {
        active: !subscription.active,
      },
    });
  }

  /**
   * Delete a subscription
   */
  async remove(id: string, familyId: string) {
    await this.findOne(id, familyId);

    await this.prisma.subscription.delete({
      where: { id },
    });

    return { message: "Subscription deleted successfully" };
  }

  /**
   * Generate invoices from subscriptions for a period
   * This would typically be called by a cron job or manual trigger
   */
  async generateInvoicesForPeriod(periodId: string, familyId: string) {
    // Verify period exists and is open
    const period = await this.prisma.period.findFirst({
      where: { id: periodId, familyId, status: "OPEN" },
    });

    if (!period) {
      throw new NotFoundException(`Open period ${periodId} not found`);
    }

    // Get active subscriptions
    const subscriptions = await this.prisma.subscription.findMany({
      where: { familyId, active: true },
    });

    // Parse period ID to get year and month
    const [year, month] = periodId.split("-").map(Number);
    const periodDate = new Date(year, month - 1, 1);

    // Get incomes for the period
    const incomes = await this.prisma.income.findMany({
      where: { periodId },
      include: { user: true },
    });

    if (incomes.length === 0) {
      throw new BadRequestException(
        "No incomes found for period. Add incomes first.",
      );
    }

    const generatedInvoices = [];

    // For each subscription, check if it should generate an invoice for this period
    for (const subscription of subscriptions) {
      // Check if subscription is active during this period
      const startDate = new Date(subscription.startDate);
      const endDate = subscription.endDate
        ? new Date(subscription.endDate)
        : null;

      if (startDate > periodDate) {
        continue; // Subscription hasn't started yet
      }

      if (endDate && endDate < periodDate) {
        continue; // Subscription has ended
      }

      // Check if already generated for this period
      const existingInvoice = await this.prisma.invoice.findFirst({
        where: {
          periodId,
          familyId,
          vendor: subscription.vendor,
          category: subscription.category,
          description: {
            contains: subscription.name,
          },
        },
      });

      if (existingInvoice) {
        continue; // Already generated
      }

      // Calculate shares based on distribution rules
      const distributionRules = subscription.distributionRules as any;

      // Create invoice (simplified - in production, would use AllocationService)
      const invoice = await this.prisma.invoice.create({
        data: {
          familyId,
          periodId,
          category: subscription.category,
          vendor: subscription.vendor,
          description: `${subscription.name} - ${subscription.frequency}`,
          totalCents: subscription.amountCents,
          distributionMethod: subscription.distributionMethod,
          distribution: {
            create: {
              method: subscription.distributionMethod,
              percentRules: distributionRules.percentRules || null,
              fixedRules: distributionRules.fixedRules || null,
              remainderMethod: distributionRules.remainderMethod || null,
            },
          },
        },
      });

      // Update last generated timestamp
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
}
