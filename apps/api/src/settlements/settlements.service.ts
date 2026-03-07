import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PeriodStatus } from "@kost/shared";
import { CreateSettlementEntryDto, ReverseSettlementEntryDto } from "./dto/create-settlement-entry.dto";
import { CreateSettlementPlanDto } from "./dto/create-settlement-plan.dto";

type SettlementEntryType =
  | "payment"
  | "credit_applied"
  | "unpaid_carry_forward"
  | "unpaid_plan_charge"
  | "adjustment"
  | "write_down"
  | "reversal";

type SettlementPlanType =
  | "full_next_period"
  | "fixed_amount_per_period"
  | "fixed_number_of_periods";

interface SettlementEntry {
  id: string;
  familyId: string;
  periodId: string;
  fromUserId: string;
  toUserId: string;
  type: SettlementEntryType;
  amountCents: number;
  effectiveDate: string;
  comment?: string;
  createdBy: string;
  createdAt: string;
  reversedAt?: string;
  reversedBy?: string;
  reversalComment?: string;
  reversedEntryId?: string;
}

interface SettlementPlan {
  id: string;
  familyId: string;
  sourcePeriodId: string;
  fromUserId: string;
  toUserId: string;
  originalAmountCents: number;
  planType: SettlementPlanType;
  configuredAmountCents?: number;
  configuredPeriodCount?: number;
  startPeriodId: string;
  status: "active" | "completed";
  comment?: string;
  createdBy: string;
  createdAt: string;
}

interface PeriodSettlementData {
  entries: SettlementEntry[];
  plans: SettlementPlan[];
}

interface PairSummary {
  fromUserId: string;
  toUserId: string;
  baseObligationCents: number;
  carriedCreditCents: number;
  plannedAdditionCents: number;
  paymentsCents: number;
  adjustmentsCents: number;
  writeDownsCents: number;
  effectiveDueCents: number;
  remainingCents: number;
  generatedCreditCents: number;
  unresolvedUnpaidWithoutPlanCents: number;
}

function pairKey(fromUserId: string, toUserId: string): string {
  return `${fromUserId}::${toUserId}`;
}

function toMonthIndex(periodId: string): number {
  const [year, month] = periodId.split("-").map(Number);
  return year * 12 + month;
}

@Injectable()
export class SettlementsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getPeriodOrThrow(periodId: string, familyId: string) {
    const period = await this.prisma.period.findFirst({ where: { id: periodId, familyId } });
    if (!period) throw new NotFoundException(`Period ${periodId} not found`);
    return period;
  }

  private parseSettlementData(raw: unknown): PeriodSettlementData {
    if (!raw || typeof raw !== "object") return { entries: [], plans: [] };
    const data = raw as Partial<PeriodSettlementData>;
    return {
      entries: Array.isArray(data.entries) ? data.entries as SettlementEntry[] : [],
      plans: Array.isArray(data.plans) ? data.plans as SettlementPlan[] : [],
    };
  }

  private async loadPeriodSettlementData(periodId: string, familyId: string): Promise<PeriodSettlementData> {
    const period = await this.getPeriodOrThrow(periodId, familyId);
    return this.parseSettlementData(period.settlementData);
  }

  private async savePeriodSettlementData(periodId: string, familyId: string, data: PeriodSettlementData) {
    await this.prisma.period.update({ where: { id: periodId }, data: { settlementData: data as unknown as object } });
  }

  private applyPlanCharge(plan: SettlementPlan, periodId: string, usedCents: number): number {
    const currentIdx = toMonthIndex(periodId);
    const startIdx = toMonthIndex(plan.startPeriodId);
    if (currentIdx < startIdx || plan.status !== "active") return 0;

    const remaining = Math.max(plan.originalAmountCents - usedCents, 0);
    if (remaining <= 0) return 0;

    if (plan.planType === "full_next_period") {
      return currentIdx === startIdx ? remaining : 0;
    }

    if (plan.planType === "fixed_amount_per_period") {
      const configured = plan.configuredAmountCents ?? remaining;
      return Math.min(configured, remaining);
    }

    const periods = Math.max(plan.configuredPeriodCount ?? 1, 1);
    const index = currentIdx - startIdx;
    if (index < 0 || index >= periods) return 0;
    const base = Math.floor(plan.originalAmountCents / periods);
    const remainder = plan.originalAmountCents - base * periods;
    if (index === periods - 1) return base + remainder;
    return base;
  }

  private async getAllSettlementData(familyId: string) {
    const periods = await this.prisma.period.findMany({
      where: { familyId },
      orderBy: { id: "asc" },
      include: {
        invoices: {
          include: {
            shares: true,
            payments: true,
          },
        },
      },
    });

    return periods.map((period: any) => ({
      period,
      data: this.parseSettlementData(period.settlementData),
    }));
  }

  private deriveBaseObligations(invoices: Array<{ totalCents: number; shares: Array<{ userId: string; shareCents: number }>; payments: Array<{ paidById: string; amountCents: number }> }>) {
    const map = new Map<string, number>();
    for (const invoice of invoices) {
      if (!invoice.shares.length || !invoice.payments.length || invoice.totalCents <= 0) continue;
      for (const payment of invoice.payments) {
        for (const share of invoice.shares) {
          if (share.userId === payment.paidById) continue;
          const shareOfPayment = Math.round((share.shareCents / invoice.totalCents) * payment.amountCents);
          const key = pairKey(share.userId, payment.paidById);
          map.set(key, (map.get(key) ?? 0) + shareOfPayment);
        }
      }
    }
    return map;
  }

  private ensureAdmin(role?: string) {
    if (role !== "ADMIN") {
      throw new ForbiddenException("Only admins can modify settlement state");
    }
  }

  async getPeriodSummary(periodId: string, familyId: string) {
    const list = await this.getAllSettlementData(familyId);
    const idx = list.findIndex((item: any) => item.period.id === periodId);
    if (idx < 0) throw new NotFoundException(`Period ${periodId} not found`);

    const baseMap = this.deriveBaseObligations(list[idx].period.invoices);
    const openingCredit = new Map<string, number>();
    const unresolvedWarnings: Array<{ sourcePeriodId: string; fromUserId: string; toUserId: string; amountCents: number }> = [];
    const plans = list.flatMap((item: any) => item.data.plans);

    // Carry credits from previous periods forward and detect unresolved unpaid without plan.
    for (let i = 0; i < idx; i += 1) {
      const currentPeriod = list[i];
      const currentBase = this.deriveBaseObligations(currentPeriod.period.invoices);
      const periodEntries = currentPeriod.data.entries.filter((entry: any) => !entry.reversedAt);

      const paidByPair = new Map<string, number>();
      const writeDownByPair = new Map<string, number>();
      const adjustmentByPair = new Map<string, number>();
      for (const entry of periodEntries) {
        const key = pairKey(entry.fromUserId, entry.toUserId);
        if (entry.type === "payment") paidByPair.set(key, (paidByPair.get(key) ?? 0) + entry.amountCents);
        if (entry.type === "write_down") writeDownByPair.set(key, (writeDownByPair.get(key) ?? 0) + entry.amountCents);
        if (entry.type === "adjustment") adjustmentByPair.set(key, (adjustmentByPair.get(key) ?? 0) + entry.amountCents);
      }

      for (const [key, base] of currentBase.entries()) {
        const appliedCredit = openingCredit.get(key) ?? 0;
        const planned = plans
          .filter((plan: any) => pairKey(plan.fromUserId, plan.toUserId) === key && toMonthIndex(plan.startPeriodId) <= toMonthIndex(currentPeriod.period.id))
          .reduce((sum: number, plan: any) => sum + this.applyPlanCharge(plan, currentPeriod.period.id, 0), 0);
        const paid = paidByPair.get(key) ?? 0;
        const writeDown = writeDownByPair.get(key) ?? 0;
        const adjustment = adjustmentByPair.get(key) ?? 0;
        const effectiveDue = Math.max(base - appliedCredit + planned + adjustment - writeDown, 0);
        const remaining = Math.max(effectiveDue - paid, 0);
        const creditGenerated = Math.max(paid - effectiveDue, 0);

        if (creditGenerated > 0) {
          openingCredit.set(key, (openingCredit.get(key) ?? 0) + creditGenerated);
        } else {
          openingCredit.set(key, Math.max((openingCredit.get(key) ?? 0) - appliedCredit, 0));
        }

        const hasPlan = plans.some((plan: any) => plan.sourcePeriodId === currentPeriod.period.id && pairKey(plan.fromUserId, plan.toUserId) === key && plan.status === "active");
        if (remaining > 0 && !hasPlan && currentPeriod.period.status === PeriodStatus.CLOSED) {
          unresolvedWarnings.push({
            sourcePeriodId: currentPeriod.period.id,
            fromUserId: key.split("::")[0],
            toUserId: key.split("::")[1],
            amountCents: remaining,
          });
        }
      }
    }

    const currentEntries = list[idx].data.entries.filter((entry: any) => !entry.reversedAt);
    const currentPlans = plans;
    const pairSet = new Set<string>([...baseMap.keys(), ...openingCredit.keys()]);

    const summaryRows: PairSummary[] = [];
    for (const key of pairSet) {
      const [fromUserId, toUserId] = key.split("::");
      const base = baseMap.get(key) ?? 0;
      const credit = openingCredit.get(key) ?? 0;
      const plannedAddition = currentPlans
        .filter((plan: any) => pairKey(plan.fromUserId, plan.toUserId) === key)
        .reduce((sum: number, plan: any) => sum + this.applyPlanCharge(plan, periodId, 0), 0);
      const payments = currentEntries
        .filter((entry: any) => entry.type === "payment" && pairKey(entry.fromUserId, entry.toUserId) === key)
        .reduce((sum: number, entry: any) => sum + entry.amountCents, 0);
      const adjustments = currentEntries
        .filter((entry: any) => entry.type === "adjustment" && pairKey(entry.fromUserId, entry.toUserId) === key)
        .reduce((sum: number, entry: any) => sum + entry.amountCents, 0);
      const writeDowns = currentEntries
        .filter((entry: any) => entry.type === "write_down" && pairKey(entry.fromUserId, entry.toUserId) === key)
        .reduce((sum: number, entry: any) => sum + entry.amountCents, 0);
      const effectiveDue = Math.max(base - credit + plannedAddition + adjustments - writeDowns, 0);
      const remaining = Math.max(effectiveDue - payments, 0);
      const generatedCredit = Math.max(payments - effectiveDue, 0);

      summaryRows.push({
        fromUserId,
        toUserId,
        baseObligationCents: base,
        carriedCreditCents: credit,
        plannedAdditionCents: plannedAddition,
        paymentsCents: payments,
        adjustmentsCents: adjustments,
        writeDownsCents: writeDowns,
        effectiveDueCents: effectiveDue,
        remainingCents: remaining,
        generatedCreditCents: generatedCredit,
        unresolvedUnpaidWithoutPlanCents: unresolvedWarnings
          .filter((warning) => warning.fromUserId === fromUserId && warning.toUserId === toUserId)
          .reduce((sum, warning) => sum + warning.amountCents, 0),
      });
    }

    return {
      periodId,
      rows: summaryRows,
      totals: {
        totalOwedCents: summaryRows.reduce((sum, row) => sum + row.effectiveDueCents, 0),
        totalPaidCents: summaryRows.reduce((sum, row) => sum + row.paymentsCents, 0),
        totalCreditCents: summaryRows.reduce((sum, row) => sum + row.carriedCreditCents + row.generatedCreditCents, 0),
        totalUnpaidCents: summaryRows.reduce((sum, row) => sum + row.remainingCents, 0),
        unresolvedWarningCount: unresolvedWarnings.length,
      },
      warnings: unresolvedWarnings,
      history: list[idx].data.entries,
      plans: list[idx].data.plans,
    };
  }

  async getOpeningWarnings(targetPeriodId: string, familyId: string) {
    const summary = await this.getPeriodSummary(targetPeriodId, familyId);
    return summary.warnings;
  }

  async createEntry(dto: CreateSettlementEntryDto, familyId: string, actor: { userId: string; role?: string }) {
    this.ensureAdmin(actor.role);
    if (dto.fromUserId === dto.toUserId) throw new BadRequestException("fromUserId and toUserId must differ");

    const period = await this.getPeriodOrThrow(dto.periodId, familyId);
    if (period.status !== PeriodStatus.CLOSED) {
      throw new BadRequestException("Settlement entries can only be registered on closed periods");
    }

    const data = await this.loadPeriodSettlementData(dto.periodId, familyId);
    const entry: SettlementEntry = {
      id: `set_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      familyId,
      periodId: dto.periodId,
      fromUserId: dto.fromUserId,
      toUserId: dto.toUserId,
      type: dto.type,
      amountCents: dto.amountCents,
      effectiveDate: dto.effectiveDate ?? new Date().toISOString(),
      comment: dto.comment,
      createdBy: actor.userId,
      createdAt: new Date().toISOString(),
    };

    data.entries.push(entry);
    await this.savePeriodSettlementData(dto.periodId, familyId, data);
    return entry;
  }

  async createPlan(dto: CreateSettlementPlanDto, familyId: string, actor: { userId: string; role?: string }) {
    this.ensureAdmin(actor.role);
    if (dto.fromUserId === dto.toUserId) throw new BadRequestException("fromUserId and toUserId must differ");

    const sourceSummary = await this.getPeriodSummary(dto.sourcePeriodId, familyId);
    const sourcePair = sourceSummary.rows.find((row) => row.fromUserId === dto.fromUserId && row.toUserId === dto.toUserId);
    const unresolved = sourcePair?.remainingCents ?? 0;
    if (unresolved <= 0) throw new BadRequestException("No unresolved unpaid balance for selected pair");

    const startPeriodId = dto.startPeriodId ?? sourceSummary.periodId;
    await this.getPeriodOrThrow(startPeriodId, familyId);

    const targetData = await this.loadPeriodSettlementData(dto.sourcePeriodId, familyId);
    const plan: SettlementPlan = {
      id: `spl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      familyId,
      sourcePeriodId: dto.sourcePeriodId,
      fromUserId: dto.fromUserId,
      toUserId: dto.toUserId,
      originalAmountCents: unresolved,
      planType: dto.planType,
      configuredAmountCents: dto.configuredAmountCents,
      configuredPeriodCount: dto.configuredPeriodCount,
      startPeriodId,
      status: "active",
      comment: dto.comment,
      createdBy: actor.userId,
      createdAt: new Date().toISOString(),
    };

    targetData.plans.push(plan);
    await this.savePeriodSettlementData(dto.sourcePeriodId, familyId, targetData);
    return plan;
  }

  async reverseEntry(periodId: string, entryId: string, dto: ReverseSettlementEntryDto, familyId: string, actor: { userId: string; role?: string }) {
    this.ensureAdmin(actor.role);
    if (!dto.comment?.trim()) throw new BadRequestException("Reversal comment is required");

    const data = await this.loadPeriodSettlementData(periodId, familyId);
    const existing = data.entries.find((entry) => entry.id === entryId);
    if (!existing) throw new NotFoundException("Settlement entry not found");
    if (existing.reversedAt) throw new BadRequestException("Entry already reversed");

    existing.reversedAt = new Date().toISOString();
    existing.reversedBy = actor.userId;
    existing.reversalComment = dto.comment;

    const reversal: SettlementEntry = {
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      familyId,
      periodId,
      fromUserId: existing.toUserId,
      toUserId: existing.fromUserId,
      type: "reversal",
      amountCents: existing.amountCents,
      effectiveDate: new Date().toISOString(),
      comment: dto.comment,
      createdBy: actor.userId,
      createdAt: new Date().toISOString(),
      reversedEntryId: existing.id,
    };

    data.entries.push(reversal);
    await this.savePeriodSettlementData(periodId, familyId, data);
    return { reversed: existing, reversal };
  }
}
