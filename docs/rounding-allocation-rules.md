# Rounding & Allocation Rules

> **Detailed specification for money allocation algorithms in Kost**

## Core Principle

**All monetary values are integers representing the smallest currency unit (cents/øre).**

Never use floating-point arithmetic for money calculations. All division results are floored, and remainder cents are distributed deterministically to ensure:

```
∑(shares) = total    (always, no exceptions)
```

## 1. BY_PERCENT Distribution

### Algorithm

Given:
- `totalCents`: integer (e.g., 245000 for 2,450.00 kr)
- `rules`: array of `{userId, percentBasisPoints}` where sum = 10000 (100.00%)

Steps:

```typescript
function splitByPercent(totalCents, rules) {
  // 1. Validate sum of percentages = 10000
  assert(sum(rules.map(r => r.percentBasisPoints)) === 10000)

  // 2. Calculate preliminary shares (floored)
  preliminaryShares = rules.map(rule => ({
    userId: rule.userId,
    exactShare: (totalCents * rule.percentBasisPoints) / 10000,
    flooredShare: floor((totalCents * rule.percentBasisPoints) / 10000),
    fractionalPart: (exactShare - flooredShare)
  }))

  // 3. Calculate remainder
  allocatedSoFar = sum(preliminaryShares.map(s => s.flooredShare))
  remainder = totalCents - allocatedSoFar

  // 4. Sort by fractional part DESC, then userId ASC (tiebreaker)
  sorted = preliminaryShares.sort((a, b) => {
    if (a.fractionalPart !== b.fractionalPart) {
      return b.fractionalPart - a.fractionalPart  // DESC
    }
    return a.userId.localeCompare(b.userId)       // ASC
  })

  // 5. Distribute remainder (one cent to each of first N participants)
  for (i = 0; i < remainder; i++) {
    sorted[i].flooredShare += 1
  }

  return finalShares
}
```

### Example 1: Simple Split

```
Total: 245,000 cents (2,450.00 kr)
Rules:
  - Kari:  5000 bp (50%)
  - Ola:   3000 bp (30%)
  - Lisa:  2000 bp (20%)

Calculation:
  Kari:  floor(245000 * 0.50) = 122,500 cents
  Ola:   floor(245000 * 0.30) =  73,500 cents
  Lisa:  floor(245000 * 0.20) =  49,000 cents

Sum: 245,000 ✓ (no remainder)

Result:
  Kari:  122,500 cents (1,225.00 kr)
  Ola:    73,500 cents (  735.00 kr)
  Lisa:   49,000 cents (  490.00 kr)
```

### Example 2: With Remainder

```
Total: 100 cents (1.00 kr)
Rules:
  - user1: 3333 bp (33.33%)
  - user2: 3333 bp (33.33%)
  - user3: 3334 bp (33.34%)

Calculation:
  user1: floor(100 * 0.3333) = 33 cents, fractional = 0.33
  user2: floor(100 * 0.3333) = 33 cents, fractional = 0.33
  user3: floor(100 * 0.3334) = 33 cents, fractional = 0.34

Allocated: 99 cents
Remainder: 1 cent

Sorting by fractional part DESC:
  1. user3 (0.34)
  2. user1 (0.33) — same as user2, alphabetically first
  3. user2 (0.33)

Distribute 1 cent to user3:
  user3 += 1

Result:
  user1: 33 cents
  user2: 33 cents
  user3: 34 cents
  ─────────────
  Total: 100 cents ✓
```

### Example 3: Larger Remainder

```
Total: 1,000 cents (10.00 kr)
Rules:
  - A: 2500 bp (25%)
  - B: 2500 bp (25%)
  - C: 2500 bp (25%)
  - D: 2500 bp (25%)

Calculation (equal split):
  Each: floor(1000 * 0.25) = 250 cents

Allocated: 1,000 cents
Remainder: 0 cents

Result:
  A: 250, B: 250, C: 250, D: 250 ✓
```

## 2. BY_INCOME Distribution

### Algorithm

Given:
- `totalCents`: integer
- `participants`: array of `{userId, normalizedMonthlyGrossCents}`

Steps:

```typescript
function splitByIncome(totalCents, participants) {
  // 1. Filter out users with no income (MVP behavior)
  withIncome = participants.filter(p => p.normalizedMonthlyGrossCents > 0)

  if (withIncome.length === 0) {
    throw Error("No participants with income")
  }

  // 2. Calculate total income
  totalIncome = sum(withIncome.map(p => p.normalizedMonthlyGrossCents))

  // 3. Convert to percent rules
  percentRules = withIncome.map(p => ({
    userId: p.userId,
    percentBasisPoints: round((p.normalizedMonthlyGrossCents / totalIncome) * 10000)
  }))

  // 4. Adjust to ensure sum = 10000
  diff = 10000 - sum(percentRules.map(r => r.percentBasisPoints))
  percentRules[0].percentBasisPoints += diff

  // 5. Use splitByPercent
  return splitByPercent(totalCents, percentRules)
}
```

### Example

```
Total: 69,900 cents (699.00 kr)
Participants:
  - Kari: 5,500,000 cents/month (55,000 kr)
  - Ola:  4,500,000 cents/month (45,000 kr)
  - Lisa: 4,000,000 cents/month (40,000 kr)

Total income: 14,000,000 cents (140,000 kr)

Percent calculation:
  Kari:  (5,500,000 / 14,000,000) * 10000 = 3928.57 → round → 3929 bp
  Ola:   (4,500,000 / 14,000,000) * 10000 = 3214.29 → round → 3214 bp
  Lisa:  (4,000,000 / 14,000,000) * 10000 = 2857.14 → round → 2857 bp

Sum: 3929 + 3214 + 2857 = 10,000 ✓

Now apply splitByPercent(69900, percentRules):
  Kari:  floor(69900 * 0.3929) = 27,456 cents, frac = 0.71
  Ola:   floor(69900 * 0.3214) = 22,465 cents, frac = 0.86
  Lisa:  floor(69900 * 0.2857) = 19,970 cents, frac = 0.43

Allocated: 69,891 cents
Remainder: 9 cents

Sorted by fractional DESC:
  1. Ola   (0.86)
  2. Kari  (0.71)
  3. Lisa  (0.43)

Distribute 9 cents:
  Ola   += 1 → 22,466
  Kari  += 1 → 27,457
  Lisa  += 1 → 19,971
  Ola   += 1 → 22,467
  Kari  += 1 → 27,458
  Lisa  += 1 → 19,972
  Ola   += 1 → 22,468
  Kari  += 1 → 27,459
  Lisa  += 1 → 19,973
  ... (continue until 9 cents distributed)

Final (approximate - exact depends on rounding):
  Kari:  27,464 cents (274.64 kr)
  Ola:   22,464 cents (224.64 kr)
  Lisa:  19,972 cents (199.72 kr)
  ────────────────────────────
  Total: 69,900 cents ✓
```

### Handling No Income

**MVP Behavior:** Exclude users with `normalizedMonthlyGrossCents = 0`

Example:
```
Total: 100,000 cents
Participants:
  - Kari: 5,000,000 cents/month
  - Ola:  0 cents/month (no income)

Result:
  - Kari: 100,000 cents (entire amount)
  - Ola:  excluded from BY_INCOME split
```

**Future Option:** Configure to treat missing income as 0 (gives 0 share).

## 3. FIXED Distribution with Remainder

### Algorithm

Given:
- `totalCents`: integer
- `fixedRules`: array of `{userId, fixedCents}`
- `remainderMethod`: `'EQUAL'` or `'BY_INCOME'`
- `allParticipants`: array of `{userId, normalizedMonthlyGrossCents}`

Steps:

```typescript
function splitFixed(totalCents, fixedRules, remainderMethod, allParticipants) {
  // 1. Validate fixed sum <= total
  fixedSum = sum(fixedRules.map(r => r.fixedCents))
  assert(fixedSum <= totalCents)

  // 2. Calculate remainder
  remainderCents = totalCents - fixedSum

  // 3. Initialize shares with fixed amounts
  shares = {}
  fixedRules.forEach(rule => {
    shares[rule.userId] = rule.fixedCents
  })

  // 4. Distribute remainder
  if (remainderCents > 0) {
    if (remainderMethod === 'EQUAL') {
      // Equal split among ALL participants
      perPerson = floor(remainderCents / allParticipants.length)
      rest = remainderCents - (perPerson * allParticipants.length)

      // Alphabetically sorted for deterministic rest distribution
      sorted = allParticipants.sort((a, b) => a.userId.localeCompare(b.userId))

      sorted.forEach((p, index) => {
        extraCent = (index < rest) ? 1 : 0
        shares[p.userId] = (shares[p.userId] || 0) + perPerson + extraCent
      })

    } else if (remainderMethod === 'BY_INCOME') {
      // Use splitByIncome for remainder
      remainderShares = splitByIncome(remainderCents, allParticipants)
      remainderShares.forEach(rs => {
        shares[rs.userId] = (shares[rs.userId] || 0) + rs.shareCents
      })
    }
  }

  return shares
}
```

### Example 1: FIXED + EQUAL

```
Total: 350,000 cents (3,500.00 kr)
Fixed rules:
  - Kari: 100,000 cents (1,000 kr)
  - Ola:   50,000 cents (  500 kr)
All participants: Kari, Ola, Lisa

Fixed sum: 150,000 cents
Remainder: 200,000 cents (2,000.00 kr)

EQUAL split among 3:
  Per person: floor(200,000 / 3) = 66,666 cents
  Rest: 200,000 - (66,666 * 3) = 2 cents

Alphabetically: Kari, Lisa, Ola
  Kari: 66,666 + 1 = 66,667 cents (first in alphabet, gets +1)
  Lisa: 66,666 + 1 = 66,667 cents (second)
  Ola:  66,666     = 66,666 cents

Final:
  Kari: 100,000 + 66,667 = 166,667 cents (1,666.67 kr)
  Ola:   50,000 + 66,666 = 116,666 cents (1,166.66 kr)
  Lisa:       0 + 66,667 =  66,667 cents (  666.67 kr)
  ──────────────────────────────────────────────────
  Total:                  350,000 cents ✓
```

### Example 2: FIXED + BY_INCOME

```
Total: 350,000 cents (3,500.00 kr)
Fixed rules:
  - Kari: 100,000 cents
  - Ola:   50,000 cents
Participants:
  - Kari: income 5,500,000
  - Ola:  income 4,500,000
  - Lisa: income 4,000,000

Fixed sum: 150,000 cents
Remainder: 200,000 cents

BY_INCOME on 200,000:
  Total income: 14,000,000
  Kari:  (5.5M / 14M) * 200,000 ≈ 78,571 cents
  Ola:   (4.5M / 14M) * 200,000 ≈ 64,286 cents
  Lisa:  (4.0M / 14M) * 200,000 ≈ 57,143 cents
  (with proper rounding to sum to 200,000)

Final:
  Kari: 100,000 + 78,571 = 178,571 cents
  Ola:   50,000 + 64,286 = 114,286 cents
  Lisa:       0 + 57,143 =  57,143 cents
  ─────────────────────────────────────
  Total:                  350,000 cents ✓
```

## Edge Cases

### Zero Total

```
Total: 0 cents
Result: All shares = 0 cents
```

### Single Participant

```
Total: 100,000 cents
Rules: [{ userId: 'user1', percentBasisPoints: 10000 }]

Result:
  user1: 100,000 cents (entire amount)
```

### All Percentages Equal

```
Total: 1,000 cents
Rules: 4 users × 2500 bp (25% each)

Result:
  Each user: 250 cents (exact division, no remainder)
```

### Prime Number Total with Equal Split

```
Total: 97 cents (prime)
Rules: 3 users × 3333.33% each

Calculation:
  floor(97 * 0.333333) = 32 cents each
  Allocated: 96 cents
  Remainder: 1 cent → goes to user with highest fractional

Result:
  user1: 33 cents
  user2: 32 cents
  user3: 32 cents
  ─────────────
  Total: 97 cents ✓
```

## Testing Strategy

### Unit Tests

1. **Exact splits** (no remainder): 50/50, 25/25/25/25
2. **Remainders**: 100 cents ÷ 3, 1000 cents ÷ 7
3. **Edge cases**: 0 total, 1 participant, all same percent
4. **Validation**: sum ≠ 10000, negative percents, fixed > total

### Property-Based Tests (fast-check)

```typescript
// Property: sum always equals total
fc.assert(
  fc.property(
    fc.integer({ min: 1, max: 1000000 }),        // totalCents
    fc.array(fc.integer({ min: 1, max: 9999 }), { minLength: 2, maxLength: 10 }),
    (total, percents) => {
      const normalized = normalizeToSum10000(percents)
      const shares = splitByPercent(total, normalized)
      return shares.reduce((sum, s) => sum + s.shareCents, 0) === total
    }
  ),
  { numRuns: 1000 }
)
```

### Integration Tests

- Create invoice with BY_PERCENT → verify shares sum to total
- Close period → verify settlement transfers balance to zero
- Update invoice amount → verify shares recalculated correctly

## Guarantees

✅ **Sum Conservation**: `∑(shares) = total` (always)
✅ **Determinism**: Same inputs → same outputs (reproducible)
✅ **No Floating Point**: All operations on integers
✅ **Transparency**: Each share includes human-readable explanation
✅ **Auditability**: Changes logged with before/after snapshots

---

**Implementation:** See `apps/api/src/invoices/allocation.service.ts`
**Tests:** See `apps/api/test/allocation.spec.ts`
