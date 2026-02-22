# Kost

A self-hosted app for tracking shared household expenses. Family members register expenses, and Kost splits the costs — equally, by custom percentage, or proportional to each person's income.

## Features

- **Expense management** — create, categorize, and allocate expenses among family members
- **Flexible cost splitting** — income-proportional, custom percentage per user, or equal split
- **BY_INCOME user selection** — choose which users to include in income-based splits; live income percentages shown per user; JUNIOR (child) users excluded by default
- **Payment tracking** — mark invoices as paid, record partial payments with payment method, see paid/remaining amounts; the invoice list shows a green **Paid** badge for fully paid invoices and an amber badge with the remaining amount for partially paid ones; filter by payment status (paid / partially paid / unpaid)
- **Recurring expenses (subscriptions)** — define recurring fees (monthly, quarterly, annual, etc.) with vendor, category, amount, and split rules; generate invoices for the current period with one click; toggle active/inactive to suspend without deleting
- **Vendor management** — store reusable vendors with optional logos (upload a local file or enter a URL); vendor logos are displayed in the invoice list and as a searchable dropdown when creating expenses or subscriptions
- **Managed categories** — admins/adults maintain a per-family category list used as a dropdown when creating invoices
- **Managed payment methods** — admins/adults maintain a list of payment methods (e.g. bank transfer, cash) used as a dropdown when registering payments
- **Currency setting** — admins set the family's display currency (NOK, SEK, DKK, EUR, USD, GBP); all amounts are shown in the selected currency throughout the app
- **User roles** — ADMIN (full access), ADULT (create/pay invoices), JUNIOR (child; excluded from cost splits by default, must be opted in per invoice)
- **Dashboard** — overview showing your personal share and period total with adaptive font sizing for large amounts, plus a category breakdown card showing each expense category's share of your total
- **Period management** — monthly billing periods with stats and settlement summaries
- **Income registration** — each user registers their own monthly/annual gross income from their profile settings (with a confirmation prompt before saving); used for income-proportional splits; admins can view and override any family member's income directly from the Users admin page
- **User avatars** — users upload a profile photo from the Settings page; admins can set or replace avatars for any member from the Users admin page; old files are automatically removed on replace or delete
- **User management** — admins can add, edit, and delete family members (including password reset and avatar management)
- **Settings page** — users can update their profile (including avatar upload), register their income, and change their password
- **Family settings** — admins can manage currency, categories, payment methods, and vendors
- **Offline support** — works without internet; mutations sync when reconnected
- **Multi-language** — English and Norwegian (Bokmål)
- **Precise money math** — all calculations in integer cents, no floating-point errors

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

- **Web UI:** http://localhost:3001
- **API:** http://localhost:3000
- **API docs:** http://localhost:3000/api/docs

**Default login:**

| Username | Password | Role  |
|----------|----------|-------|
| andreas  | kostpass | Admin |
| marta    | kostpass | Adult |

---

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
npm run dev:web   # terminal 2 — Web on port 3001
```

### Useful commands

```bash
npm run docker:up          # build images and start all services
npm run docker:build       # force rebuild images without cache
npm run docker:down        # stop all services
npm run docker:logs        # view logs
npm run db:migrate         # apply migrations (API container must be running)
npm run db:seed            # seed sample data (API container must be running)
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
- [Setup & Troubleshooting](SETUP.md) — installing Node, Docker, fixing common errors

---

## License

Private — family use only.
