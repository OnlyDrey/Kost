# Family Finance PWA

> **A self-hosted, privacy-first Progressive Web App for shared family expense tracking with precise, auditable financial calculations.**

[![CI](https://github.com/your-org/family-finance/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/family-finance/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🎯 Overview

Family Finance is a complete, production-ready PWA for managing shared household expenses among family members. It handles invoice registration, payment tracking, cost allocation (by percentage, income, or fixed amounts), period closing with automatic settlement calculations, and comprehensive audit logging.

### Key Features

- ✅ **Precise Money Handling**: All amounts stored and calculated in cents (øre) using integer arithmetic—no floating-point errors
- 🔐 **Passwordless Authentication**: WebAuthn/FIDO2 passkeys + magic link email fallback
- 📱 **Full PWA Support**: Install on any device, works offline, background sync for mutations
- 💰 **Flexible Cost Allocation**:
  - **By Percent**: Custom percentage splits (e.g., 50/30/20)
  - **By Income**: Proportional to monthly gross income
  - **Fixed + Remainder**: Fixed amounts with configurable remainder distribution
- 📊 **Period Management**: Monthly periods with lock/close/reopen functionality
- 🔍 **Full Auditability**: Every create/update/delete logged with before/after snapshots
- 🌍 **Internationalization**: English and Norwegian (Bokmål) with locale-aware formatting
- 🎨 **Modern UI**: Material Design with dark/light theme, responsive across all devices
- 🔄 **Subscriptions**: Recurring expenses with auto-generation into periods

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │   Service    │  │   IndexedDB  │      │
│  │   (React)    │──│    Worker    │──│   (Dexie)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                     Reverse Proxy (Caddy)                   │
│                    TLS Termination + Routing                │
└─────────────────────────────────────────────────────────────┘
                    │                    │
        ┌───────────┘                    └───────────┐
        │                                            │
┌───────────────┐                            ┌───────────────┐
│  React PWA    │                            │  NestJS API   │
│  (Vite)       │                            │  (TypeScript) │
│  - MUI        │                            │  - Prisma ORM │
│  - i18n       │                            │  - OpenAPI    │
│  - Workbox    │                            │  - Passport   │
└───────────────┘                            └───────────────┘
                                                     │
                                             ┌───────────────┐
                                             │  PostgreSQL   │
                                             │  (Database)   │
                                             └───────────────┘
```

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Material-UI 5
- React Router 6
- React Query (TanStack)
- i18next
- Dexie (IndexedDB)
- Workbox (Service Worker)

**Backend:**
- Node.js 20 + TypeScript
- NestJS (framework)
- Prisma ORM
- PostgreSQL 16
- Passport JWT
- @simplewebauthn/server
- Nodemailer

**Infrastructure:**
- Docker + Docker Compose
- Caddy (reverse proxy with auto-HTTPS)
- GitHub Actions (CI/CD)

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20
- Docker & Docker Compose
- PostgreSQL 16 (if running locally without Docker)

### 1. Clone and Install

```bash
git clone https://github.com/your-org/family-finance.git
cd family-finance
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your values:

```bash
# Database
DB_PASSWORD=your-secure-password

# Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your-jwt-secret-here
MAGIC_LINK_SECRET=your-magic-link-secret-here

# SMTP (for magic links)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@familyfinance.local

# Domain
DOMAIN=localhost  # or your.domain.com for production
```

### 3. Start with Docker Compose

```bash
# Start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

This starts:
- PostgreSQL on port `5432`
- API on port `3000`
- Web UI on port `8080`
- Reverse proxy (Caddy) on ports `80` and `443`

### 4. Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed example data
npm run db:seed
```

### 5. Access the Application

Open https://localhost in your browser.

**Development Users (from seed):**
- admin@familyfinance.local (Admin role)
- ola@familyfinance.local (Adult role)
- lisa@familyfinance.local (Adult role)

Use the **magic link** flow to log in (links will be logged to API console in dev mode).

## 📦 Project Structure

```
family-finance/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/           # Authentication (magic link, WebAuthn)
│   │   │   ├── users/          # User management
│   │   │   ├── periods/        # Period lifecycle & closing
│   │   │   ├── incomes/        # Income tracking
│   │   │   ├── invoices/       # Invoice CRUD + allocation
│   │   │   ├── payments/       # Payment tracking
│   │   │   ├── subscriptions/  # Recurring expenses
│   │   │   ├── audit/          # Audit log
│   │   │   └── ...
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   ├── migrations/     # Migration history
│   │   │   └── seed.ts         # Seed data
│   │   └── test/               # Tests
│   │
│   └── web/                    # React PWA Frontend
│       ├── src/
│       │   ├── pages/          # Route pages
│       │   ├── components/     # Reusable components
│       │   ├── services/       # API client
│       │   ├── stores/         # Context providers
│       │   ├── hooks/          # Custom hooks
│       │   ├── i18n/           # Translations
│       │   ├── sw/             # Service worker
│       │   └── idb/            # IndexedDB (offline)
│       └── public/
│           └── manifest.webmanifest
│
├── packages/
│   └── shared/                 # Shared TypeScript types & schemas
│
├── reverse-proxy/
│   └── Caddyfile               # Reverse proxy config
│
├── docker-compose.yml
└── README.md
```

## 💰 Money Handling & Allocation Rules

### Precision Guarantee

All monetary amounts are:
- **Stored as integers** in the smallest currency unit (øre/cents)
- Example: 1,234.56 NOK → `123456` cents
- **No floating-point arithmetic** anywhere in calculations or storage

### Allocation Methods

#### 1. By Percent (`BY_PERCENT`)

Split invoice by custom percentages that sum to 100%.

**Example:** 2,450 kr split 50% / 30% / 20%

```
Kari:  1,225.00 kr (50%)
Ola:     735.00 kr (30%)
Lisa:    490.00 kr (20%)
────────────────────────
Total: 2,450.00 kr
```

**Rounding Rules:**
1. Calculate exact share: `totalCents * percentBasisPoints / 10000`
2. Floor each share to integer
3. Compute remainder: `total - sum(flooredShares)`
4. Distribute remainder cents one-by-one to participants with:
   - Highest fractional part first
   - Tiebreaker: alphabetical by `userId`

#### 2. By Income (`BY_INCOME`)

Split proportionally to each member's normalized monthly gross income.

**Example:** 699 kr split among Kari (55k), Ola (45k), Lisa (40k)

```
Total income: 140,000 kr/month

Kari:  274.64 kr (55k / 140k = 39.29%)
Ola:   224.64 kr (45k / 140k = 32.14%)
Lisa:  199.72 kr (40k / 140k = 28.57%)
────────────────────────────────────────
Total:  699.00 kr
```

**Special Cases:**
- Users with **no income** in the period are **excluded** from BY_INCOME splits (MVP default)
- If **all** users have no income, the allocation fails with a clear error

#### 3. Fixed + Remainder (`FIXED`)

Assign fixed amounts to specific users; distribute remainder by `EQUAL` or `BY_INCOME`.

**Example:** 3,500 kr with Kari fixed 1,000 kr, Ola fixed 500 kr, remainder BY_INCOME

```
Fixed:      Kari 1,000 kr, Ola 500 kr
Remainder:  3,500 - 1,500 = 2,000 kr

Distribute 2,000 kr BY_INCOME:
  Kari:   785.79 kr (39.29%)
  Ola:    642.79 kr (32.14%)
  Lisa:   571.42 kr (28.57%)

Final Shares:
  Kari:  1,785.79 kr (1,000 fixed + 785.79 remainder)
  Ola:   1,142.79 kr (500 fixed + 642.79 remainder)
  Lisa:    571.42 kr (0 fixed + 571.42 remainder)
  ──────────────────────────────────────────────────────
  Total: 3,500.00 kr ✓
```

### Sum Conservation

**Invariant:** `sum(shares) == invoice.totalCents` **always**, enforced by:
- Deterministic rounding algorithm
- Automated tests (including property-based tests with `fast-check`)

## 📅 Period Management

### Lifecycle

1. **OPEN**: Default state. Invoices, payments, and incomes can be created/modified.
2. **CLOSED**: Period locked. No modifications allowed. Settlement calculated.

### Closing a Period (Admin Only)

When closing period `2026-03`:

1. **Calculate balances** for each user:
   ```
   balance = sum(payments made) - sum(invoice shares)
   ```
   - Positive balance → should **receive** money
   - Negative balance → should **pay** money

2. **Generate settlement transfers** (minimal set):
   - Greedy algorithm: match largest debtor with largest creditor
   - Example:
     ```
     Kari:  -500 kr (owes)
     Ola:   +300 kr (is owed)
     Lisa:  +200 kr (is owed)

     Transfers:
       Kari → Ola:  300 kr
       Kari → Lisa: 200 kr
     ```

3. **Store settlement data** in `Period.settlementData` (JSON)
4. **Lock period**: Set `status = CLOSED`, `closedAt = now()`, `closedBy = adminUserId`

### Reopening a Period (Admin Only)

- Changes status back to `OPEN`
- Clears `closedAt` and `settlementData`
- **Logged in AuditLog** with `action = PERIOD_REOPEN`

## 🔐 Authentication & Security

### Passwordless Authentication

**1. Magic Link (Primary)**
- User enters email
- API generates one-time token (JWT signed, 10 min expiry)
- Email sent with link: `https://app.example.com/auth/verify?token=...`
- User clicks link → token verified → session created

**2. WebAuthn/Passkeys (Future Enhancement)**
- Currently scaffolded but not fully integrated in UI
- Uses `@simplewebauthn/server` for registration/verification

### Security Features

- ✅ JWT stored in **HTTP-only cookies** (not localStorage)
- ✅ `SameSite=Strict` cookie policy
- ✅ Helmet.js security headers
- ✅ Rate limiting on auth endpoints (10 req/min)
- ✅ HTTPS enforced via Caddy
- ✅ CORS restricted to configured origin
- ✅ Input validation with `class-validator`
- ✅ SQL injection protection via Prisma parameterized queries
- ✅ Family-scoped data isolation (users only see their family's data)

### Roles & Permissions

| Role    | Permissions                                                  |
|---------|--------------------------------------------------------------|
| `ADMIN` | Full access: invite users, close/reopen periods, delete     |
| `ADULT` | Create/edit invoices & payments in open periods, view all   |
| `JUNIOR`| Read-only (future: limited visibility)                       |

## 🧪 Testing

### Run Tests

```bash
# API unit + integration tests
npm run test --workspace=apps/api

# API e2e tests
npm run test:e2e --workspace=apps/api

# Coverage report
npm run test:cov --workspace=apps/api
```

### Test Coverage

The allocation service has **extensive coverage** including:
- ✅ Unit tests for each distribution method
- ✅ Edge cases (0 amounts, single user, all equal percentages)
- ✅ **Property-based tests** (`fast-check`) verifying sum conservation
- ✅ Rounding determinism checks

Example property test:
```typescript
fc.assert(
  fc.property(
    fc.integer({ min: 100, max: 1000000 }),
    fc.array(fc.integer({ min: 1, max: 9999 }), { minLength: 2 }),
    (totalCents, percents) => {
      const shares = service.splitByPercent(totalCents, normalizedPercents);
      return shares.reduce((sum, s) => sum + s.shareCents, 0) === totalCents;
    }
  ),
  { numRuns: 100 }
);
```

## 🔄 Offline Support

### Service Worker (Workbox)

**Caching Strategies:**
- **Static assets** (JS, CSS, images): `CacheFirst` with 1-year expiry
- **API GET requests**: `NetworkFirst` (prefer fresh, fallback to cache)
- **API mutations** (POST/PUT/DELETE): Queued in IndexedDB

### Offline Queue

1. User creates invoice while offline
2. Request stored in **IndexedDB queue** via Dexie
3. Service worker registers **background sync** event
4. When online, background sync fires → queue drained → mutations sent to API
5. UI updated via React Query invalidation

**Queue Schema:**
```typescript
{
  id: string,
  method: 'POST' | 'PUT' | 'DELETE',
  url: string,
  body: any,
  timestamp: Date,
  retries: number
}
```

## 🌍 Internationalization

Supported locales:
- `en` (English)
- `nb` (Norwegian Bokmål) — **default**

### Currency Formatting

```typescript
formatCurrency(245000, 'nb-NO') // "2 450,00 kr"
formatCurrency(245000, 'en-US') // "NOK 2,450.00"
```

### Date Formatting

```typescript
formatDate('2026-03-15', 'nb-NO') // "15. mars 2026"
formatDate('2026-03-15', 'en-US') // "March 15, 2026"
```

## 📊 Database Schema (ERD)

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Family    │──1:N──│    User     │──1:N──│   Income    │
└─────────────┘       └─────────────┘       └─────────────┘
      │                      │                      │
      │                      │                      │
      │                      │               ┌─────────────┐
      │                      └──────────────│   Period    │
      │                                     └─────────────┘
      │                                            │
      │                                            │
      │                                     ┌─────────────┐
      └─────────────────────────────────────│   Invoice   │
                                            └─────────────┘
                                                   │
                     ┌─────────────────────────────┼─────────────────────────────┐
                     │                             │                             │
              ┌─────────────┐             ┌─────────────────┐           ┌─────────────┐
              │ InvoiceLine │             │  InvoiceShare   │           │   Payment   │
              └─────────────┘             └─────────────────┘           └─────────────┘
                                                   │
                                          ┌─────────────────────────┐
                                          │ InvoiceDistributionRule │
                                          └─────────────────────────┘
```

**Key Tables:**
- `Family`: Top-level container
- `User`: Family members with roles
- `Period`: Monthly periods (YYYY-MM format)
- `Income`: User income per period (normalized to monthly gross)
- `Invoice`: Expenses with distribution method
- `InvoiceLine`: Line items (optional)
- `InvoiceDistributionRule`: Stores percent/fixed rules (JSON)
- `InvoiceShare`: Calculated shares per user (cached)
- `Payment`: Payments against invoices
- `AuditLog`: Immutable audit trail

## 🚢 Deployment

### Production Checklist

1. **Generate secrets:**
   ```bash
   openssl rand -base64 32  # for JWT_SECRET
   openssl rand -base64 32  # for MAGIC_LINK_SECRET
   ```

2. **Configure SMTP** (required for magic links):
   - Gmail: Use [App Passwords](https://support.google.com/accounts/answer/185833)
   - SendGrid, Mailgun, or any SMTP provider

3. **Set domain** in `.env`:
   ```bash
   DOMAIN=finance.yourdomain.com
   WEBAUTHN_RP_ID=finance.yourdomain.com
   WEBAUTHN_ORIGIN=https://finance.yourdomain.com
   APP_URL=https://finance.yourdomain.com
   ```

4. **Deploy with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

5. **Run migrations:**
   ```bash
   docker-compose exec api npx prisma migrate deploy
   ```

6. **Backup PostgreSQL:**
   ```bash
   docker-compose exec db pg_dump -U financeuser familyfinance > backup.sql
   ```

### Environment Variables Reference

| Variable                | Required | Description                              |
|-------------------------|----------|------------------------------------------|
| `NODE_ENV`              | No       | `production` or `development`            |
| `DB_USER`               | Yes      | PostgreSQL username                      |
| `DB_PASSWORD`           | Yes      | PostgreSQL password                      |
| `DB_NAME`               | Yes      | PostgreSQL database name                 |
| `DATABASE_URL`          | Yes      | Full connection string (auto-generated)  |
| `JWT_SECRET`            | Yes      | Secret for signing JWTs                  |
| `JWT_EXPIRES_IN`        | No       | Token expiry (default: `7d`)             |
| `MAGIC_LINK_SECRET`     | Yes      | Secret for magic link tokens             |
| `MAGIC_LINK_EXPIRES_IN` | No       | Token expiry in seconds (default: `600`) |
| `SMTP_HOST`             | Yes      | SMTP server hostname                     |
| `SMTP_PORT`             | Yes      | SMTP port (usually `587` or `465`)       |
| `SMTP_USER`             | Yes      | SMTP username                            |
| `SMTP_PASSWORD`         | Yes      | SMTP password                            |
| `SMTP_FROM`             | Yes      | From address for emails                  |
| `APP_URL`               | Yes      | Application base URL (with `https://`)   |
| `DOMAIN`                | Yes      | Domain for Caddy reverse proxy           |
| `WEBAUTHN_RP_NAME`      | No       | Relying party name (default: `Family Finance`) |
| `WEBAUTHN_RP_ID`        | Yes      | Relying party ID (must match domain)     |
| `WEBAUTHN_ORIGIN`       | Yes      | Origin for WebAuthn (must match APP_URL) |

## 🧑‍💻 Development

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Start PostgreSQL (via Docker or native)
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:16-alpine

# Set up database
npm run db:migrate
npm run db:seed

# Start API (terminal 1)
npm run dev:api

# Start Web (terminal 2)
npm run dev:web
```

### Code Quality

```bash
# Lint
npm run lint

# Format
npm run format

# Type check
npm run build
```

### Database Management

```bash
# Create new migration
npm run migrate --workspace=apps/api -- --name my_migration

# Reset database (⚠️ destructive)
npm run migrate:reset --workspace=apps/api

# Open Prisma Studio (DB GUI)
npm run studio --workspace=apps/api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- **TypeScript strict mode** enabled
- **ESLint + Prettier** for consistency
- **No `any` types** without justification
- **All money as integers** (never floats)
- **Tests required** for allocation logic and critical paths

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by family needs for transparent expense sharing
- Built with modern TypeScript, React, and NestJS
- Security best practices from OWASP guidelines
- PWA patterns from Google Workbox

---

**Made with ❤️ for families who value financial transparency**

For questions or issues, please open an issue on GitHub.
