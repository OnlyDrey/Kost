# Database

## Overview

Kost uses **PostgreSQL 16** with **Prisma ORM** for type-safe database access.

Schema file: `apps/api/prisma/schema.prisma`

## Key Tables

| Table                     | Description                                    |
|---------------------------|------------------------------------------------|
| `Family`                  | Top-level container for a household            |
| `User`                    | Family members with roles (ADMIN, ADULT)       |
| `Period`                  | Monthly billing periods (OPEN or CLOSED)       |
| `UserIncome`              | User income per period (for income-based splits) |
| `Invoice`                 | Expenses to be split among family members      |
| `InvoiceShare`            | Calculated share per user for each invoice     |
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

Seed users (all with password `password123`):

| Email               | Role    |
|---------------------|---------|
| admin@kost.local    | ADMIN   |
| ola@kost.local      | ADULT   |
| lisa@kost.local     | ADULT   |

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
