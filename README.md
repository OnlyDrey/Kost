<p align="center">
  <img src="apps/web/public/logo-mark.svg" alt="Kost logo" width="96" />
</p>
<h1 align="center">Kost</h1>

<p align="center">Self-hosted shared expense tracking for households.</p>

## What it is

Kost is a single-container web app (React frontend + NestJS API + PostgreSQL) for shared household finances: invoices, payments, recurring subscriptions, period closing, and family-level settings.

## Who it is for

- Households that want self-hosted shared expense tracking.
- Operators who want a simple Docker deployment with clear runtime controls.

## Key features

- Shared expense tracking with weighted allocation
- Family/workspace settings (categories, vendors, payment methods, currency)
- Recurring subscription invoicing per period
- Payment tracking, period summaries, and dashboard views
- Cookie-based auth with role-aware access
- Audit events for key administrative and financial actions

## Quick start (Docker)

```bash
git clone https://github.com/OnlyDrey/Kost.git
cd Kost
cp .env.example .env
# Required before first run:
# - set JWT_SECRET
# - set BOOTSTRAP_ADMIN_PASSWORD
docker compose up --build
```

After startup:

- App: <http://localhost:3000>
- Health: <http://localhost:3000/api/health>
- API docs: <http://localhost:3000/api/docs>

## Documentation

- [System overview](docs/overview.md)
- [Setup and deployment](docs/setup-and-deployment.md)
- [Operations](docs/operations.md)
- [Contributing](docs/contributing.md)
