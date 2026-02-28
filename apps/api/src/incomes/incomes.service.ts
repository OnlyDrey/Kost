import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateIncomeDto } from "./dto/create-income.dto";
import { UpdateIncomeDto } from "./dto/update-income.dto";
import { IncomeType, PeriodStatus } from "@prisma/client";

@Injectable()
export class IncomesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Normalize income to monthly gross amount
   */
  private normalizeIncome(inputType: IncomeType, inputCents: number): number {
    switch (inputType) {
      case IncomeType.MONTHLY_GROSS:
        return inputCents;
      case IncomeType.MONTHLY_NET:
        // Assume net is ~70% of gross (simplified)
        return Math.round(inputCents / 0.7);
      case IncomeType.ANNUAL_GROSS:
        return Math.round(inputCents / 12);
      case IncomeType.ANNUAL_NET:
        // Convert annual net to monthly gross
        return Math.round(inputCents / 12 / 0.7);
      default:
        return inputCents;
    }
  }

  /**
   * Get all incomes for a period
   */
  async findByPeriod(periodId: string, familyId: string) {
    // Verify period belongs to family
    const period = await this.prisma.period.findFirst({
      where: { id: periodId, familyId },
    });

    if (!period) {
      throw new NotFoundException(`Period ${periodId} not found`);
    }

    return this.prisma.income.findMany({
      where: { periodId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Get income for a specific user in a period
   */
  async findOne(id: string, familyId: string) {
    const income = await this.prisma.income.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            familyId: true,
          },
        },
        period: true,
      },
    });

    if (!income || income.user.familyId !== familyId) {
      throw new NotFoundException(`Income with ID ${id} not found`);
    }

    return income;
  }

  /**
   * Create or update income for a user in a period
   */
  async createOrUpdate(createIncomeDto: CreateIncomeDto, familyId: string) {
    const { userId, periodId, inputType, inputCents } = createIncomeDto;

    // Verify user belongs to family
    const user = await this.prisma.user.findFirst({
      where: { id: userId, familyId },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Verify period belongs to family and is open
    const period = await this.prisma.period.findFirst({
      where: { id: periodId, familyId },
    });

    if (!period) {
      throw new NotFoundException(`Period ${periodId} not found`);
    }

    if (period.status === PeriodStatus.CLOSED) {
      throw new BadRequestException("Cannot add income to a closed period");
    }

    // Calculate normalized monthly gross
    const normalizedMonthlyGrossCents = this.normalizeIncome(
      inputType,
      inputCents,
    );

    // Check if income already exists for this user/period
    const existingIncome = await this.prisma.income.findUnique({
      where: {
        userId_periodId: {
          userId,
          periodId,
        },
      },
    });

    if (existingIncome) {
      // Update existing income
      return this.prisma.income.update({
        where: { id: existingIncome.id },
        data: {
          inputType,
          inputCents,
          normalizedMonthlyGrossCents,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              role: true,
            },
          },
        },
      });
    }

    // Create new income
    return this.prisma.income.create({
      data: {
        userId,
        periodId,
        inputType,
        inputCents,
        normalizedMonthlyGrossCents,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Update an income
   */
  async update(id: string, updateIncomeDto: UpdateIncomeDto, familyId: string) {
    // Find and verify income
    const income = await this.findOne(id, familyId);

    // Check if period is still open
    const period = await this.prisma.period.findUnique({
      where: { id: income.periodId },
    });

    if (period?.status === PeriodStatus.CLOSED) {
      throw new BadRequestException("Cannot update income in a closed period");
    }

    // Determine new values
    const inputType = updateIncomeDto.inputType ?? income.inputType;
    const inputCents = updateIncomeDto.inputCents ?? income.inputCents;

    // Recalculate normalized value if needed
    const normalizedMonthlyGrossCents = this.normalizeIncome(
      inputType,
      inputCents,
    );

    return this.prisma.income.update({
      where: { id },
      data: {
        ...(updateIncomeDto.inputType && {
          inputType: updateIncomeDto.inputType,
        }),
        ...(updateIncomeDto.inputCents !== undefined && {
          inputCents: updateIncomeDto.inputCents,
        }),
        normalizedMonthlyGrossCents,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Delete an income
   */
  async remove(id: string, familyId: string) {
    const income = await this.findOne(id, familyId);

    // Check if period is still open
    const period = await this.prisma.period.findUnique({
      where: { id: income.periodId },
    });

    if (period?.status === PeriodStatus.CLOSED) {
      throw new BadRequestException(
        "Cannot delete income from a closed period",
      );
    }

    await this.prisma.income.delete({
      where: { id },
    });

    return { message: "Income deleted successfully" };
  }
}
