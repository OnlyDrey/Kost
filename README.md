# Kost

A self-hosted app for tracking shared household expenses. Family members register expenses, and Kost splits the costs — equally, by custom percentage, or proportional to each person's income.

## Features

- 💸 Create & split expenses (equal, %, or by income)
- 👨‍👩‍👧 Income-based splits with user control
- ✅ Track paid, partial, and unpaid invoices
- 🔁 Recurring expenses with one-click period invoices
- 🏷 Vendors with logos & reusable categories
- 💳 Managed payment methods
- 📊 Dashboard with personal share & category breakdown
- 🗓 Monthly periods with summaries & settlements
- 🧾 User income registration for fair splits
- 🖼 User avatars & profile settings
- ⚙️ Family & user admin settings
- 🌍 English & Norwegian (Bokmål)

## Quick Start

### Requirements

- Node.js 22 LTS ([install via nvm](SETUP.md))
- Docker + Docker Compose V2 ([install guide](SETUP.md))

### 1. Get repo files
```bash
git clone https://github.com/OnlyDrey/Kost.git && cd Kost
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```bash
DB_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret   # openssl rand -base64 32
```

### 4. Build and start services

```bash
npm run docker:up      # builds images and starts all services
```

### 5. Set up database

Run these after the containers are healthy (`docker compose ps` to check):

```bash
npm run db:migrate     # apply migrations (runs inside the API container)
npm run db:seed        # load sample data (runs inside the API container)
```

### 6. Open the app

- **Web UI:** http://localhost:3000
- **API docs:** http://localhost:3000/api/docs

**Default login:**

| Username | Password | Role  |
|----------|----------|-------|
| admin    | kostpass | Admin |



## Recent UX and Architecture Updates

- Unified expense presentation with shared `ExpenseItemCard` + `TagPill` components across invoices, subscriptions, detail headers, and dashboard recent expenses.
- Shared analytics components (`TileGrid`, `SpendBreakdownCard`) now power both Dashboard and Period statistics layouts.
- Shared `UserSharesGrid` component is reused on expense detail and period shares for consistent share presentation.
- Added expense list category filtering, paid-completed grouping, and overdue highlighting (red border/tag/amount).
- Improved recurring expense edit/create persistence for selected users (`distributionRules.userIds`) and explicit active-state editing.
- Centralized locale-aware currency formatting in `apps/web/src/utils/currency.ts` using `Intl.NumberFormat` with correct symbol placement.
- Payments UX updated with **Mark as complete** primary action wording and paid state reflected in cards/detail views.

---


## Design and UX guardrails (keep in future PRs)

To avoid regressions and style drift, follow these product-level rules when touching UI:

- **Period cards:** keep compact round icon actions on the right side (stats always available, close for Admin/Adult on open periods, edit+delete for Admin on closed periods).
- **Distribution forms (expenses + recurring expenses):** use the same dropdown options and interaction patterns across both flows.
- **Selection defaults:** new forms should not auto-select children in income/custom/equal/fixed-amount flows.
- **User share cards:** use responsive grid scaling (`auto-fit + minmax`) instead of fixed vertical stacks.
- **Accessibility:** icon-only controls must include `aria-label` and tooltip/title.

When introducing visual changes, document the intended interaction model in this README and relevant docs so later PRs can make deliberate design choices.

## iOS Safari refresh white-screen hardening

The web container serves SPA routes and app shell with explicit cache prevention:

- `index.html` is served with `Cache-Control: no-store, no-cache, must-revalidate` headers from both `express.static` and the SPA fallback route in `apps/api/src/main.ts`.
- The Workbox service worker uses `fetchOptions.cache: 'no-store'` on navigation requests to bypass the browser HTTP cache layer entirely.
- SPA route refresh falls back to `/index.html` for any path not matching `/api/*`, `/uploads/*`, or a file with an extension.

If you still see stale behavior on iOS after deploying, clear website data in Safari once (the stale cache predates the fix). See [Troubleshooting](docs/TROUBLESHOOTING.md) for details.

## Development

Run the API and web locally (database still in Docker):

```bash
# Start database only
docker run -d -p 5432:5432 \
  -e POSTGRES_USER=kostuser -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=kost \
  postgres:16-alpine

# Generate Prisma client and apply migrations
export DATABASE_URL=postgresql://kostuser:dev@localhost:5432/kost
npm run generate --workspace=apps/api
npm run migrate --workspace=apps/api
npm run seed --workspace=apps/api

npm run dev:api   # terminal 1 — API on port 3000
npm run dev:web   # terminal 2 — Web dev server on port 3001 (proxies /api → :3000)
```

### Useful commands

```bash
npm run docker:up          # build images and start all services
npm run docker:build       # force rebuild images without cache
npm run docker:down        # stop all services
npm run docker:logs        # view logs
npm run db:migrate         # apply migrations (API container must be running)
npm run db:seed            # seed sample data (API container must be running)

# Seed behavior is reset-style idempotent in dev (safe to re-run for a clean baseline)
npm run test --workspace=apps/api          # run tests
npm run studio --workspace=apps/api        # open Prisma Studio
```

---

## Documentation

- [Architecture](docs/architecture.md) — tech stack, project structure, auth flow
- [Deployment](docs/deployment.md) — production setup, reverse proxy, environment variables
- [Database](docs/database.md) — schema, migrations, seed data
- [Allocation Rules](docs/allocation-rules.md) — how cost splits are calculated with exact rounding
- [Contributing](docs/contributing.md) — branching strategy, PR guidelines, code style, development workflow
- [Branding](docs/branding.md) — logo assets, favicon/app icon usage, and placement guidelines
- [Setup](SETUP.md) — installing Node, Docker, initial setup
- [Troubleshooting](docs/TROUBLESHOOTING.md) — iOS blank screen fix, common errors, service worker issues
- [Audit Report](docs/AUDIT.md) — full codebase audit with findings and refactor proposals

---

## License

Private — family use only.