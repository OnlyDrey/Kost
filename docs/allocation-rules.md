# Allocation Rules

> How Kost splits invoice amounts among family members with guaranteed precision.

## Core Principle

**All monetary values are integers representing the smallest currency unit (cents/øre).**

Never use floating-point arithmetic for money calculations. All division results are floored, and remainder cents are distributed deterministically to ensure:

```
∑(shares) = total    (always, no exceptions)
```

## Distribution Methods

### 1. Equal Split (`EQUAL`)

Divides the total equally among all family members. Remaining cents (when the total is not evenly divisible) go to the first users alphabetically by `userId`.

### 2. Custom Split (`CUSTOM`)

Manually specify each user's share in cents. The sum must equal the invoice total.

### 3. Income-Based Split (`INCOME_BASED`)

Splits proportionally to each member's normalized monthly gross income for the period.

**Algorithm:**

1. Filter out users with no income (they receive no share)
2. Calculate percentage basis points: `round((income / totalIncome) * 10000)` for each user
3. Adjust so the sum equals exactly 10000 basis points
4. Apply the percent split algorithm below

---

## Percent Split Algorithm

Given `totalCents` and `rules` (array of `{userId, percentBasisPoints}` summing to 10000):

```
1. Calculate exact share:   exactShare = totalCents * percentBasisPoints / 10000
2. Floor each share:        flooredShare = floor(exactShare)
3. Calculate remainder:     remainder = totalCents - sum(flooredShares)
4. Sort by fractional part DESC, then userId ASC (for deterministic tiebreaking)
5. Add 1 cent to the first `remainder` participants in the sorted list
```

### Example: 2,450 kr split 50% / 30% / 20%

```
Kari:  floor(245000 * 0.50) = 122,500 øre  →  1,225.00 kr
Ola:   floor(245000 * 0.30) =  73,500 øre  →    735.00 kr
Lisa:  floor(245000 * 0.20) =  49,000 øre  →    490.00 kr
─────────────────────────────────────────────────────────
Total:                         245,000 øre  →  2,450.00 kr ✓
```

### Example: 1 kr split three ways (remainder case)

```
Each gets 33.33...%

user1: floor(100 * 0.3333) = 33 øre, fractional = 0.33
user2: floor(100 * 0.3333) = 33 øre, fractional = 0.33
user3: floor(100 * 0.3334) = 33 øre, fractional = 0.34

Allocated: 99 øre, Remainder: 1 øre
Sort by fractional DESC: user3 (0.34), user1 (0.33), user2 (0.33)
user3 gets the extra cent.

Result: user1=33, user2=33, user3=34  →  Total: 100 ✓
```

---

## Guarantees

- **Sum conservation**: `∑(shares) = total` always
- **Determinism**: same inputs always produce same outputs
- **No floating point**: all operations on integers
- **Auditability**: each share includes a human-readable explanation

---

**Implementation:** `apps/api/src/invoices/allocation.service.ts`
**Tests:** `apps/api/test/allocation.spec.ts`
