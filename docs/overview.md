# System Overview

## What you need

- Basic familiarity with Docker Compose and web app deployment.
- Understanding of household expense workflows (periods, invoices, payments).

## What you get

- A concise model of the system architecture and boundaries.
- Core domain concepts and invariants used by API and UI.
- Data model overview aligned to current backend behavior.

## Architecture at a glance

Kost runs as two services in Docker Compose:

1. `db`: PostgreSQL 16
2. `app`: single container serving both API (`/api/*`) and web app (`/`)

```text
Browser
  -> HTTP(S) reverse proxy (optional, recommended in production)
    -> kost-app container (:3000)
      -> NestJS API (/api)
      -> Static web assets (React + Vite build)
      -> PostgreSQL via Prisma
```

## Components

### Frontend (`apps/web`)

- React 18 + TypeScript + Vite
- React Router + React Query
- i18next localization
- Optional PWA support (disabled by default)

### Backend (`apps/api`)

- NestJS + Prisma
- Auth with JWT in HTTP-only cookies
- Feature modules: auth, users, family, periods, invoices, payments, subscriptions, audit, health

### Shared package (`packages/shared`)

- Shared TypeScript types and schema primitives used across workspaces

## Core domain concepts

- **Family**: top-level workspace for users and configuration.
- **Period**: accounting window used for summaries and settlement.
- **Invoice**: expense entry that can be allocated across household members.
- **Payment**: settlement records tied to a period/member context.
- **Subscription**: recurring rule that can generate invoices per period.
- **Audit event**: server-side event log for operationally relevant actions.

## Data model overview

The backend uses Prisma models for users, periods, invoices, payments, subscriptions, and family configuration metadata. Monetary values are stored as integers (cents) to avoid floating-point drift in allocation and totals.

## Domain rules and invariants

- Money is represented as integer cents in storage and calculations.
- Periods are explicit lifecycle objects; period reports are derived from period-scoped records.
- Allocation logic must preserve total invoice value after share distribution.
- Only authenticated users can access core financial endpoints.
- Admin-capable actions (family settings and sensitive controls) require elevated role checks.

## Key operational constraints

- `VITE_ENABLE_PWA` is `false` by default to reduce stale-cache behavior in production.
- `HEALTH_REQUIRE_WEB_ASSETS=true` makes health checks fail when API is up but web build artifacts are missing.
- Reverse proxy + HTTPS is the recommended production topology.
