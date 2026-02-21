# Database

## Overview

Kost uses **PostgreSQL 16** with **Prisma ORM** for type-safe database access.

Schema file: `apps/api/prisma/schema.prisma`

## Key Tables

| Table                     | Description                                    |
|---------------------------|------------------------------------------------|
| `Family`                  | Top-level container; stores `categories[]`, `paymentMethods[]`, and `currency` |
| `User`                    | Family members with roles (ADMIN, ADULT, JUNIOR) |
| `Period`                  | Monthly billing periods (OPEN or CLOSED)       |
| `Income`                  | User income per period (for income-based splits) |
| `Invoice`                 | Expenses to be split among family members      |
| `InvoiceShare`            | Calculated share per user for each invoice     |
| `Payment`                 | Payments recorded against an invoice; includes optional `paymentMethod` |
| `Vendor`                  | Reusable vendors per family; optional logo URL for display |
| `Subscription`            | Recurring expense definitions; generates invoices on demand per period |
| `MagicLinkToken`          | _(unused — kept in schema for migrations)_     |
| `WebAuthnCredential`      | _(unused — kept in schema for migrations)_     |

## Common Operations

```bash
# Create a new migration (after editing schema.prisma)
npm run migrate --workspace=apps/api -- --name describe_your_change

# Apply pending migrations (production)
npm run migrate:deploy --workspace=apps/api

# Reset the database (destructive — dev only)
npm run migrate:reset --workspace=apps/api

# Open Prisma Studio (visual database browser)
npm run studio --workspace=apps/api

# Regenerate Prisma client (after schema changes)
npm run generate --workspace=apps/api
```

## Seed Data

The seed script creates sample data for development:

```bash
npm run db:seed
```

Seed users (all with password `kostpass`):

| Username | Name    | Role  |
|----------|---------|-------|
| andreas  | Andreas | ADMIN |
| marta    | Marta   | ADULT |

The seed also creates:
- A family with Norwegian categories (Bolig, Forsikring, Bil), payment methods, and currency `NOK`
- An open period `2026-02` with realistic income entries for both users
- 10 sample invoices across Bolig, Forsikring, and Bil categories with real Norwegian vendor names
- 5 recurring subscriptions (streaming, gym, etc.)
- Vendor entries with Clearbit logo URLs

To customize seed data, edit `apps/api/prisma/seed.ts`.

## Money Storage

All monetary values are stored as **integers in cents (øre)**:
- `1,234.56 NOK` is stored as `123456`
- Never use floating-point types (`FLOAT`, `REAL`, `DOUBLE`) for money
- All arithmetic is done in integer space

See [allocation-rules.md](./allocation-rules.md) for the full rounding algorithm.

## Connection

The API connects via `DATABASE_URL` in `.env`:

```
postgresql://kostuser:kostpass@localhost:5432/kost?schema=public
```

In Docker, the hostname is `db` (the service name):

```
postgresql://kostuser:kostpass@db:5432/kost?schema=public
```
