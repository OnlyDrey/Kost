import { Injectable } from "@nestjs/common";
import {
  AllocationShare,
  PercentRule,
  FixedRule,
  RemainderMethod,
} from "@family-finance/shared";

interface ParticipantWithIncome {
  userId: string;
  userName: string;
  normalizedMonthlyGrossCents: number;
}

@Injectable()
export class AllocationService {
  /**
   * Split amount by percentage
   * Deterministic rounding: floor each share, then distribute remainder cents
   * to participants with highest fractional parts (tiebreaker: by userId alphabetically)
   */
  splitByPercent(
    totalCents: number,
    percentRules: PercentRule[],
  ): AllocationShare[] {
    // Validate: sum must be 10000 (100.00%)
    const sum = percentRules.reduce((acc, r) => acc + r.percentBasisPoints, 0);
    if (sum !== 10000) {
      throw new Error(
        `Percent rules must sum to 10000 basis points (100%), got ${sum}`,
      );
    }

    // Validate: no negative percentages
    percentRules.forEach((r) => {
      if (r.percentBasisPoints < 0) {
        throw new Error(
          `Negative percentage not allowed: ${r.percentBasisPoints}`,
        );
      }
    });

    // Calculate preliminary shares (floored)
    const preliminaryShares = percentRules.map((rule) => {
      const exactShare = (totalCents * rule.percentBasisPoints) / 10000;
      const flooredShare = Math.floor(exactShare);
      const fractionalPart = exactShare - flooredShare;

      return {
        userId: rule.userId,
        percentBasisPoints: rule.percentBasisPoints,
        flooredShare,
        fractionalPart,
      };
    });

    // Calculate remainder
    const allocatedSoFar = preliminaryShares.reduce(
      (acc, s) => acc + s.flooredShare,
      0,
    );
    const remainder = totalCents - allocatedSoFar;

    // Sort by fractional part DESC, then by userId ASC for deterministic tiebreak
    const sorted = [...preliminaryShares].sort((a, b) => {
      if (Math.abs(a.fractionalPart - b.fractionalPart) > 0.000001) {
        return b.fractionalPart - a.fractionalPart; // DESC
      }
      return a.userId.localeCompare(b.userId); // ASC
    });

    // Distribute remainder cents (1 cent to each of the first 'remainder' participants)
    const finalShares = new Map<string, number>();
    preliminaryShares.forEach((s) => finalShares.set(s.userId, s.flooredShare));

    for (let i = 0; i < remainder && i < sorted.length; i++) {
      const current = finalShares.get(sorted[i].userId) || 0;
      finalShares.set(sorted[i].userId, current + 1);
    }

    // Build results with explanations
    return percentRules.map((rule) => {
      const shareCents = finalShares.get(rule.userId) || 0;
      const percentFormatted = (rule.percentBasisPoints / 100).toFixed(2);
      const totalFormatted = (totalCents / 100).toFixed(2);
      const shareFormatted = (shareCents / 100).toFixed(2);

      return {
        userId: rule.userId,
        shareCents,
        explanation: `Your share is ${shareFormatted} kr (${percentFormatted}% of ${totalFormatted} kr)`,
      };
    });
  }

  /**
   * Split amount by income (proportional to normalized monthly gross income)
   * Excludes users with no income in the period (MVP default behavior)
   */
  splitByIncome(
    totalCents: number,
    participants: ParticipantWithIncome[],
  ): AllocationShare[] {
    // Filter out users with no income
    const withIncome = participants.filter(
      (p) => p.normalizedMonthlyGrossCents > 0,
    );

    if (withIncome.length === 0) {
      throw new Error(
        "No participants with income found for BY_INCOME distribution",
      );
    }

    const totalIncome = withIncome.reduce(
      (acc, p) => acc + p.normalizedMonthlyGrossCents,
      0,
    );

    // Convert to percent rules
    const percentRules: PercentRule[] = withIncome.map((p) => {
      const percentBasisPoints = Math.round(
        (p.normalizedMonthlyGrossCents / totalIncome) * 10000,
      );
      return {
        userId: p.userId,
        percentBasisPoints,
      };
    });

    // Adjust to ensure sum is exactly 10000
    const currentSum = percentRules.reduce(
      (acc, r) => acc + r.percentBasisPoints,
      0,
    );
    const diff = 10000 - currentSum;

    if (diff !== 0) {
      // Add/subtract difference to the first participant
      percentRules[0].percentBasisPoints += diff;
    }

    const shares = this.splitByPercent(totalCents, percentRules);

    // Update explanations to include income details
    return shares.map((share) => {
      const participant = withIncome.find((p) => p.userId === share.userId)!;
      const incomeFormatted = (
        participant.normalizedMonthlyGrossCents / 100
      ).toFixed(2);
      const totalIncomeFormatted = (totalIncome / 100).toFixed(2);
      const percentFormatted = (
        (participant.normalizedMonthlyGrossCents / totalIncome) *
        100
      ).toFixed(2);
      const shareFormatted = (share.shareCents / 100).toFixed(2);

      return {
        ...share,
        explanation: `Your share is ${shareFormatted} kr (${percentFormatted}% based on income of ${incomeFormatted} kr / ${totalIncomeFormatted} kr total)`,
      };
    });
  }

  /**
   * Split with fixed amounts + remainder
   * Remainder is distributed either EQUAL or BY_INCOME
   */
  splitFixed(
    totalCents: number,
    fixedRules: FixedRule[],
    remainderMethod: RemainderMethod,
    allParticipants: ParticipantWithIncome[],
  ): AllocationShare[] {
    // Validate: sum of fixed amounts <= total
    const fixedSum = fixedRules.reduce((acc, r) => acc + r.fixedCents, 0);
    if (fixedSum > totalCents) {
      throw new Error(
        `Sum of fixed amounts (${fixedSum} cents) exceeds total (${totalCents} cents)`,
      );
    }

    const remainderCents = totalCents - fixedSum;

    // Initialize with fixed amounts
    const finalShares = new Map<string, number>();
    fixedRules.forEach((rule) => {
      finalShares.set(rule.userId, rule.fixedCents);
    });

    // Calculate remainder distribution
    let remainderShares: AllocationShare[] = [];

    if (remainderCents > 0) {
      if (remainderMethod === "EQUAL") {
        // Equal split among ALL participants
        const perPersonRemainder = Math.floor(
          remainderCents / allParticipants.length,
        );
        const remainderRest =
          remainderCents - perPersonRemainder * allParticipants.length;

        // Sort participants by userId for deterministic distribution of rest cents
        const sortedParticipants = [...allParticipants].sort((a, b) =>
          a.userId.localeCompare(b.userId),
        );

        remainderShares = sortedParticipants.map((p, index) => {
          const baseCents = perPersonRemainder;
          const extraCent = index < remainderRest ? 1 : 0;
          const shareCents = baseCents + extraCent;

          return {
            userId: p.userId,
            shareCents,
            explanation: `Remainder: ${(shareCents / 100).toFixed(2)} kr (equal split)`,
          };
        });
      } else {
        // BY_INCOME
        remainderShares = this.splitByIncome(remainderCents, allParticipants);
      }
    }

    // Merge fixed and remainder
    remainderShares.forEach((rShare) => {
      const current = finalShares.get(rShare.userId) || 0;
      finalShares.set(rShare.userId, current + rShare.shareCents);
    });

    // Build final results with combined explanations
    return allParticipants.map((p) => {
      const totalShareCents = finalShares.get(p.userId) || 0;
      const fixedCents =
        fixedRules.find((r) => r.userId === p.userId)?.fixedCents || 0;
      const remainderCents = totalShareCents - fixedCents;

      let explanation: string;
      if (fixedCents > 0 && remainderCents > 0) {
        const fixedFormatted = (fixedCents / 100).toFixed(2);
        const remainderFormatted = (remainderCents / 100).toFixed(2);
        const totalFormatted = (totalShareCents / 100).toFixed(2);
        const method = remainderMethod === "EQUAL" ? "equal split" : "income";
        explanation = `Your share is ${totalFormatted} kr (${fixedFormatted} kr fixed + ${remainderFormatted} kr from remainder based on ${method})`;
      } else if (fixedCents > 0) {
        explanation = `Your share is ${(fixedCents / 100).toFixed(2)} kr (fixed amount)`;
      } else if (remainderCents > 0) {
        const method = remainderMethod === "EQUAL" ? "equal split" : "income";
        explanation = `Your share is ${(remainderCents / 100).toFixed(2)} kr (remainder based on ${method}, no fixed amount)`;
      } else {
        explanation = `Your share is 0.00 kr (no fixed amount or remainder allocation)`;
      }

      return {
        userId: p.userId,
        shareCents: totalShareCents,
        explanation,
      };
    });
  }

  /**
   * Validate that sum of shares equals total (used in tests and assertions)
   */
  validateSumEquals(shares: AllocationShare[], expectedTotal: number): boolean {
    const actualSum = shares.reduce((acc, s) => acc + s.shareCents, 0);
    return actualSum === expectedTotal;
  }
}
