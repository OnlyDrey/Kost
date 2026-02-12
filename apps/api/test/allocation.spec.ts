import { Test, TestingModule } from '@nestjs/testing';
import { AllocationService } from '../src/invoices/allocation.service';
import * as fc from 'fast-check';

describe('AllocationService', () => {
  let service: AllocationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AllocationService],
    }).compile();

    service = module.get<AllocationService>(AllocationService);
  });

  describe('splitByPercent', () => {
    it('should split 2450 cents by 50/30/20 percent', () => {
      const totalCents = 245000; // 2,450 NOK
      const rules = [
        { userId: 'user1', percentBasisPoints: 5000 }, // 50%
        { userId: 'user2', percentBasisPoints: 3000 }, // 30%
        { userId: 'user3', percentBasisPoints: 2000 }, // 20%
      ];
      const userNames = new Map([
        ['user1', 'User 1'],
        ['user2', 'User 2'],
        ['user3', 'User 3'],
      ]);

      const result = service.splitByPercent(totalCents, rules, userNames);

      expect(result).toHaveLength(3);
      expect(result[0].shareCents).toBe(122500); // 1,225.00
      expect(result[1].shareCents).toBe(73500);  // 735.00
      expect(result[2].shareCents).toBe(49000);  // 490.00
      expect(service.validateSumEquals(result, totalCents)).toBe(true);
    });

    it('should handle rounding with remainder distribution', () => {
      const totalCents = 100; // 1.00 NOK
      const rules = [
        { userId: 'user1', percentBasisPoints: 3333 }, // 33.33%
        { userId: 'user2', percentBasisPoints: 3333 }, // 33.33%
        { userId: 'user3', percentBasisPoints: 3334 }, // 33.34%
      ];
      const userNames = new Map([
        ['user1', 'User 1'],
        ['user2', 'User 2'],
        ['user3', 'User 3'],
      ]);

      const result = service.splitByPercent(totalCents, rules, userNames);

      // 100 * 0.3333 = 33.33 -> floor = 33
      // 100 * 0.3334 = 33.34 -> floor = 33
      // Sum of floors = 99, remainder = 1
      // Remainder goes to highest fractional (all equal, so alphabetical by userId)

      const sum = result.reduce((acc, r) => acc + r.shareCents, 0);
      expect(sum).toBe(100);
      expect(result).toHaveLength(3);
    });

    it('should throw error if percentages do not sum to 10000', () => {
      const rules = [
        { userId: 'user1', percentBasisPoints: 5000 },
        { userId: 'user2', percentBasisPoints: 4000 }, // sum = 9000
      ];

      expect(() => service.splitByPercent(100, rules, new Map())).toThrow();
    });

    it('should throw error on negative percentage', () => {
      const rules = [
        { userId: 'user1', percentBasisPoints: -100 },
        { userId: 'user2', percentBasisPoints: 10100 },
      ];

      expect(() => service.splitByPercent(100, rules, new Map())).toThrow();
    });

    // Property-based test: sum always equals total
    it('should always sum to total (property-based)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1000000 }), // total cents
          fc.array(fc.integer({ min: 1, max: 9999 }), { minLength: 2, maxLength: 5 }), // percents
          (totalCents, percents) => {
            // Normalize to sum to 10000
            const sum = percents.reduce((a, b) => a + b, 0);
            const normalized = percents.map(p => Math.floor((p / sum) * 10000));
            const diff = 10000 - normalized.reduce((a, b) => a + b, 0);
            normalized[0] += diff;

            const rules = normalized.map((p, i) => ({
              userId: `user${i}`,
              percentBasisPoints: p,
            }));

            const userNames = new Map(rules.map(r => [r.userId, r.userId]));
            const result = service.splitByPercent(totalCents, rules, userNames);

            const actualSum = result.reduce((acc, r) => acc + r.shareCents, 0);
            return actualSum === totalCents;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('splitByIncome', () => {
    it('should split by income proportionally', () => {
      const totalCents = 69900; // 699 NOK
      const participants = [
        { userId: 'user1', userName: 'Kari', normalizedMonthlyGrossCents: 5500000 }, // 55k
        { userId: 'user2', userName: 'Ola', normalizedMonthlyGrossCents: 4500000 },  // 45k
        { userId: 'user3', userName: 'Lisa', normalizedMonthlyGrossCents: 4000000 }, // 40k
      ];
      // Total income: 140k
      // Kari: 55/140 = 39.29%, Ola: 45/140 = 32.14%, Lisa: 40/140 = 28.57%

      const result = service.splitByIncome(totalCents, participants);

      expect(result).toHaveLength(3);
      expect(service.validateSumEquals(result, totalCents)).toBe(true);

      // Approximate checks
      expect(result[0].shareCents).toBeGreaterThan(27000); // ~274 kr
      expect(result[0].shareCents).toBeLessThan(28000);
    });

    it('should exclude participants with no income', () => {
      const totalCents = 100000;
      const participants = [
        { userId: 'user1', userName: 'Kari', normalizedMonthlyGrossCents: 5000000 },
        { userId: 'user2', userName: 'Ola', normalizedMonthlyGrossCents: 0 }, // No income
      ];

      const result = service.splitByIncome(totalCents, participants);

      // Only user1 should get allocation
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user1');
      expect(result[0].shareCents).toBe(100000);
    });

    it('should throw error if no participants with income', () => {
      const participants = [
        { userId: 'user1', userName: 'Kari', normalizedMonthlyGrossCents: 0 },
        { userId: 'user2', userName: 'Ola', normalizedMonthlyGrossCents: 0 },
      ];

      expect(() => service.splitByIncome(100000, participants)).toThrow();
    });
  });

  describe('splitFixed', () => {
    it('should split with fixed amounts and equal remainder', () => {
      const totalCents = 350000; // 3,500 NOK
      const fixedRules = [
        { userId: 'user1', fixedCents: 100000 }, // 1,000 kr
        { userId: 'user2', fixedCents: 50000 },  // 500 kr
      ];
      const allParticipants = [
        { userId: 'user1', userName: 'Kari', normalizedMonthlyGrossCents: 5500000 },
        { userId: 'user2', userName: 'Ola', normalizedMonthlyGrossCents: 4500000 },
        { userId: 'user3', userName: 'Lisa', normalizedMonthlyGrossCents: 4000000 },
      ];
      // Fixed sum: 1,500 kr
      // Remainder: 2,000 kr split equally = 666.67 kr each (with rounding)

      const result = service.splitFixed(totalCents, fixedRules, 'EQUAL', allParticipants);

      expect(result).toHaveLength(3);
      expect(service.validateSumEquals(result, totalCents)).toBe(true);

      // User1: 1000 + ~667 = ~1667
      // User2: 500 + ~667 = ~1167
      // User3: 0 + ~666 = ~666
      const user1 = result.find(r => r.userId === 'user1')!;
      const user2 = result.find(r => r.userId === 'user2')!;
      const user3 = result.find(r => r.userId === 'user3')!;

      expect(user1.shareCents).toBeGreaterThan(166000);
      expect(user2.shareCents).toBeGreaterThan(116000);
      expect(user3.shareCents).toBeGreaterThan(66000);
    });

    it('should split with fixed amounts and income-based remainder', () => {
      const totalCents = 350000; // 3,500 NOK
      const fixedRules = [
        { userId: 'user1', fixedCents: 100000 },
        { userId: 'user2', fixedCents: 50000 },
      ];
      const allParticipants = [
        { userId: 'user1', userName: 'Kari', normalizedMonthlyGrossCents: 5500000 },
        { userId: 'user2', userName: 'Ola', normalizedMonthlyGrossCents: 4500000 },
        { userId: 'user3', userName: 'Lisa', normalizedMonthlyGrossCents: 4000000 },
      ];

      const result = service.splitFixed(totalCents, fixedRules, 'BY_INCOME', allParticipants);

      expect(result).toHaveLength(3);
      expect(service.validateSumEquals(result, totalCents)).toBe(true);
    });

    it('should throw error if fixed sum exceeds total', () => {
      const fixedRules = [
        { userId: 'user1', fixedCents: 100000 },
        { userId: 'user2', fixedCents: 60000 },
      ];
      const participants = [
        { userId: 'user1', userName: 'User1', normalizedMonthlyGrossCents: 1000000 },
        { userId: 'user2', userName: 'User2', normalizedMonthlyGrossCents: 1000000 },
      ];

      expect(() =>
        service.splitFixed(100000, fixedRules, 'EQUAL', participants),
      ).toThrow();
    });
  });

  describe('validateSumEquals', () => {
    it('should return true when sum equals total', () => {
      const shares = [
        { userId: 'user1', shareCents: 50, explanation: '' },
        { userId: 'user2', shareCents: 50, explanation: '' },
      ];

      expect(service.validateSumEquals(shares, 100)).toBe(true);
    });

    it('should return false when sum does not equal total', () => {
      const shares = [
        { userId: 'user1', shareCents: 50, explanation: '' },
        { userId: 'user2', shareCents: 49, explanation: '' },
      ];

      expect(service.validateSumEquals(shares, 100)).toBe(false);
    });
  });
});
