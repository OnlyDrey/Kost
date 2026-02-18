# Family Finance PWA

> **A self-hosted, privacy-first Progressive Web App for shared family expense tracking with precise, auditable financial calculations.**

[![CI](https://github.com/your-org/family-finance/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/family-finance/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🎯 Overview

Family Finance is a complete, production-ready PWA for managing shared household expenses among family members. It handles invoice registration, payment tracking, cost allocation (by percentage, income, or fixed amounts), period closing with automatic settlement calculations, and comprehensive audit logging.

**Key Deployment Features:**
- 🔑 **Password authentication enabled by default** - No SMTP setup required to get started
- 🚀 **Runs directly on standard ports** - API: 3000, Web: 3001
- 🔌 **Works with any reverse proxy** - Designed for Pangolin, Nginx, Caddy, Traefik, etc.
- ⚙️ **Configurable auth methods** - Enable/disable password, magic link, or passkey authentication
- 🔒 **HTTPS via external proxy** - Keep TLS termination where you want it

### Key Features

- ✅ **Precise Money Handling**: All amounts stored and calculated in cents (øre) using integer arithmetic—no floating-point errors
- 🔐 **Flexible Authentication**: Password-based (default), magic link (optional with SMTP), or WebAuthn/FIDO2 passkeys (optional)
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
                              │ HTTP (dev) or HTTPS (via external proxy)
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                            │
┌───────────────┐                            ┌───────────────┐
│  React PWA    │                            │  NestJS API   │
│  (Vite)       │                            │  (TypeScript) │
│  Port 3001    │                            │  Port 3000    │
│  - MUI        │                            │  - Prisma ORM │
│  - i18n       │                            │  - OpenAPI    │
│  - Workbox    │                            │  - Passport   │
└───────────────┘                            └───────────────┘
                                                     │
                                             ┌───────────────┐
                                             │  PostgreSQL   │
                                             │  (Database)   │
                                             └───────────────┘

Note: Use external reverse proxy (Pangolin, Nginx, Caddy, Traefik, etc.)
      for HTTPS and routing in production
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
- Node.js 20+ + TypeScript
- NestJS (framework)
- Prisma ORM
- PostgreSQL 16
- Passport JWT
- @simplewebauthn/server
- Nodemailer

**Infrastructure:**
- Docker + Docker Compose V2
- GitHub Actions (CI/CD)
- External reverse proxy recommended for production (Pangolin, Nginx, Caddy, Traefik, etc.)

## 🚀 Quick Start

Get up and running in 5 minutes with **password authentication** (no SMTP required).

### Prerequisites

- **Node.js >= 20** (Node 22 LTS recommended — Node 18 is EOL since April 2025)
- **npm >= 9.0.0**
- **Docker 20.10+** with Docker Compose V2 (the `docker compose` plugin, not legacy `docker-compose`)
- PostgreSQL 16 (if running locally without Docker)
- **No email/SMTP setup needed** for the quick start (password auth enabled by default)

**Node Version Management:**
If you use `nvm`, the project includes an `.nvmrc` file:
```bash
nvm use  # Uses Node 22 automatically
```

### 1. Clone and Install

```bash
git clone https://github.com/your-org/family-finance.git
cd family-finance

# If using nvm (recommended)
nvm use

# Install dependencies
npm install
```

**Note:** The project suppresses non-critical security audit warnings during install (configured in `.npmrc`). Run `npm run audit` at any time to check runtime-only vulnerabilities — it will show `found 0 vulnerabilities`.

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

# Authentication Methods (at least one must be enabled)
AUTH_PASSWORD_ENABLED=true      # Password auth (enabled by default, no SMTP required)
AUTH_MAGIC_LINK_ENABLED=false   # Magic link auth (requires SMTP configuration)
AUTH_PASSKEY_ENABLED=false      # WebAuthn/Passkey auth

# SMTP (only required if AUTH_MAGIC_LINK_ENABLED=true)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@familyfinance.local
MAGIC_LINK_SECRET=your-magic-link-secret-here

# WebAuthn (only required if AUTH_PASSKEY_ENABLED=true)
WEBAUTHN_RP_NAME="Family Finance"
WEBAUTHN_RP_ID=localhost        # or your.domain.com for production
WEBAUTHN_ORIGIN=http://localhost:3001  # or https://your.domain.com
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

This starts **3 services**:
- **PostgreSQL** (database) on port `5432`
- **API** (backend) on port `3000`
- **Web** (frontend) on port `3001`

**Note:** No reverse proxy service is included. The application runs directly on these ports. For production, use an external reverse proxy (see "Reverse Proxy & HTTPS" section below).

### 4. Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed example data
npm run db:seed
```

### 5. Access the Application

Open http://localhost:3001 in your browser.

**Default Login Credentials (from seed):**

| Email                        | Password      | Role    | Description |
|------------------------------|---------------|---------|-------------|
| admin@familyfinance.local    | `password123` | `ADMIN` | Full administrative access |
| ola@familyfinance.local      | `password123` | `ADULT` | Can create/edit invoices & payments |
| lisa@familyfinance.local     | `password123` | `ADULT` | Can create/edit invoices & payments |

**Authentication Notes:**
- **Password authentication is enabled by default** (no SMTP configuration required)
- To enable magic links: Set `AUTH_MAGIC_LINK_ENABLED=true` and configure SMTP in `.env`
- To enable passkeys: Set `AUTH_PASSKEY_ENABLED=true` and configure WebAuthn settings
- Multiple authentication methods can be enabled simultaneously
- Users can choose their preferred method at login

## 📦 Project Structure

```
family-finance/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/           # Authentication (password, magic link, WebAuthn)
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

### Authentication Methods

The application supports three configurable authentication methods. **At least one must be enabled.**

**1. Password Authentication (Default)**
- **Enabled by default** with `AUTH_PASSWORD_ENABLED=true`
- Traditional email + password login
- No SMTP configuration required
- Passwords hashed with bcrypt
- Ideal for self-hosted deployments without email setup

**2. Magic Link Authentication (Optional)**
- **Requires SMTP configuration** and `AUTH_MAGIC_LINK_ENABLED=true`
- User enters email
- API generates one-time token (JWT signed, 10 min expiry)
- Email sent with link: `http://localhost:3001/auth/verify?token=...`
- User clicks link → token verified → session created
- Passwordless convenience when email is available

**3. WebAuthn/Passkey Authentication (Optional)**
- **Requires WebAuthn configuration** and `AUTH_PASSKEY_ENABLED=true`
- Biometric or hardware key authentication
- Uses `@simplewebauthn/server` for registration/verification
- Most secure option with phishing resistance
- Requires HTTPS in production (works with HTTP on localhost)

### Security Features

- ✅ JWT stored in **HTTP-only cookies** (not localStorage)
- ✅ `SameSite=Strict` cookie policy
- ✅ Helmet.js security headers
- ✅ Rate limiting on auth endpoints (10 req/min)
- ✅ HTTPS recommended for production (via external reverse proxy)
- ✅ CORS restricted to configured origin
- ✅ Input validation with `class-validator`
- ✅ SQL injection protection via Prisma parameterized queries
- ✅ Family-scoped data isolation (users only see their family's data)
- ✅ bcrypt password hashing (when password auth enabled)

### Configuring Authentication Methods

You can enable or disable each authentication method independently via environment variables. **At least one method must be enabled** for users to log in.

**Recommended Configurations:**

**Quick Start / Self-Hosted (No Email):**
```bash
AUTH_PASSWORD_ENABLED=true      # ✅ Enabled
AUTH_MAGIC_LINK_ENABLED=false
AUTH_PASSKEY_ENABLED=false
```
- Simplest setup, no SMTP required
- Users log in with email + password
- Default password for seed users: `password123`

**Production with Email:**
```bash
AUTH_PASSWORD_ENABLED=true      # ✅ Enabled (fallback)
AUTH_MAGIC_LINK_ENABLED=true    # ✅ Enabled
AUTH_PASSKEY_ENABLED=false
# Requires SMTP configuration
```
- Users can choose password or magic link
- Magic links provide better security (no password reuse)
- Requires working SMTP server

**Maximum Security:**
```bash
AUTH_PASSWORD_ENABLED=false
AUTH_MAGIC_LINK_ENABLED=true    # ✅ Enabled
AUTH_PASSKEY_ENABLED=true       # ✅ Enabled
# Requires SMTP + WebAuthn configuration
```
- No passwords, only magic links and passkeys
- Best security posture (phishing-resistant)
- Requires HTTPS in production for WebAuthn

### Roles & Permissions

| Role    | Permissions                                                  |
|---------|--------------------------------------------------------------|
| `ADMIN` | Full access: invite users, close/reopen periods, delete     |
| `ADULT` | Create/edit invoices & payments in open periods, view all   |
| `JUNIOR`| Read-only (future: limited visibility)                       |

## 🌐 Reverse Proxy & HTTPS

This application **does not include a built-in reverse proxy**. For production deployments, use an external reverse proxy to handle HTTPS, SSL/TLS certificates, and routing.

### Supported Reverse Proxies

- **Pangolin** (user's choice)
- **Nginx**
- **Caddy**
- **Traefik**
- **Apache**
- Any other reverse proxy that supports HTTP proxying

### Why External Reverse Proxy?

1. **Flexibility**: Choose the reverse proxy that fits your infrastructure
2. **Simplicity**: Application focuses on core functionality
3. **Standard Ports**: App runs on ports 3000 (API) and 3001 (Web)
4. **Easy Integration**: Works seamlessly with existing reverse proxy setups

### Development vs Production

| Environment | Protocol | URL                          | Notes                        |
|-------------|----------|------------------------------|------------------------------|
| Development | HTTP     | `http://localhost:3001`      | No reverse proxy needed      |
| Production  | HTTPS    | `https://finance.yourdomain.com` | External reverse proxy required |

### Example Configurations

**Caddy (Caddyfile):**
```caddy
finance.yourdomain.com {
    reverse_proxy /api* localhost:3000
    reverse_proxy localhost:3001
}
```

**Traefik (docker compose labels):**
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.finance.rule=Host(`finance.yourdomain.com`)"
  - "traefik.http.services.finance.loadbalancer.server.port=3001"
```

**Apache (.conf):**
```apache
<VirtualHost *:443>
    ServerName finance.yourdomain.com

    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api

    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/

    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
</VirtualHost>
```

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
   openssl rand -base64 32  # for MAGIC_LINK_SECRET (if using magic links)
   ```

2. **Configure authentication methods** in `.env`:
   ```bash
   # At least one must be enabled
   AUTH_PASSWORD_ENABLED=true      # Recommended: enabled by default
   AUTH_MAGIC_LINK_ENABLED=false   # Optional: requires SMTP
   AUTH_PASSKEY_ENABLED=false      # Optional: requires WebAuthn setup
   ```

3. **Configure SMTP** (only if `AUTH_MAGIC_LINK_ENABLED=true`):
   - Gmail: Use [App Passwords](https://support.google.com/accounts/answer/185833)
   - SendGrid, Mailgun, or any SMTP provider
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM=noreply@yourdomain.com
   ```

4. **Set application URLs** in `.env`:
   ```bash
   APP_URL=https://finance.yourdomain.com
   # WebAuthn settings (only if AUTH_PASSKEY_ENABLED=true)
   WEBAUTHN_RP_ID=finance.yourdomain.com
   WEBAUTHN_ORIGIN=https://finance.yourdomain.com
   ```

5. **Configure external reverse proxy** (Pangolin, Nginx, Caddy, Traefik, etc.):
   - Set up HTTPS/TLS certificates (Let's Encrypt recommended)
   - Route requests to:
     - Web UI: `http://localhost:3001`
     - API: `http://localhost:3000`

   Example Nginx configuration:
   ```nginx
   server {
       listen 443 ssl;
       server_name finance.yourdomain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       location / {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }

       location /api {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

6. **Deploy with Docker Compose:**
   ```bash
   docker compose up -d
   ```

7. **Run migrations:**
   ```bash
   docker compose exec api npx prisma migrate deploy
   ```

8. **Backup PostgreSQL:**
   ```bash
   docker compose exec db pg_dump -U financeuser familyfinance > backup.sql
   ```

### Environment Variables Reference

| Variable                   | Required | Description                              |
|----------------------------|----------|------------------------------------------|
| `NODE_ENV`                 | No       | `production` or `development`            |
| `DB_USER`                  | Yes      | PostgreSQL username                      |
| `DB_PASSWORD`              | Yes      | PostgreSQL password                      |
| `DB_NAME`                  | Yes      | PostgreSQL database name                 |
| `DATABASE_URL`             | Yes      | Full connection string (auto-generated)  |
| `JWT_SECRET`               | Yes      | Secret for signing JWTs                  |
| `JWT_EXPIRES_IN`           | No       | Token expiry (default: `7d`)             |
| **Authentication**         |          |                                          |
| `AUTH_PASSWORD_ENABLED`    | No       | Enable password auth (default: `true`)   |
| `AUTH_MAGIC_LINK_ENABLED`  | No       | Enable magic link auth (default: `false`) |
| `AUTH_PASSKEY_ENABLED`     | No       | Enable passkey auth (default: `false`)   |
| **Magic Link (if enabled)**|          |                                          |
| `MAGIC_LINK_SECRET`        | Conditional | Secret for magic link tokens (required if magic link enabled) |
| `MAGIC_LINK_EXPIRES_IN`    | No       | Token expiry in seconds (default: `600`) |
| `SMTP_HOST`                | Conditional | SMTP server hostname (required if magic link enabled) |
| `SMTP_PORT`                | Conditional | SMTP port (usually `587` or `465`)    |
| `SMTP_USER`                | Conditional | SMTP username                          |
| `SMTP_PASSWORD`            | Conditional | SMTP password                          |
| `SMTP_FROM`                | Conditional | From address for emails                |
| **WebAuthn (if enabled)**  |          |                                          |
| `WEBAUTHN_RP_NAME`         | No       | Relying party name (default: `Family Finance`) |
| `WEBAUTHN_RP_ID`           | Conditional | Relying party ID (must match domain, required if passkey enabled) |
| `WEBAUTHN_ORIGIN`          | Conditional | Origin for WebAuthn (must match APP_URL, required if passkey enabled) |
| **Application URLs**       |          |                                          |
| `APP_URL`                  | Yes      | Application base URL (e.g., `https://finance.yourdomain.com`) |

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

# Start API (terminal 1) - runs on port 3000
npm run dev:api

# Start Web (terminal 2) - runs on port 3001
npm run dev:web
```

**Access the application:**
- Web UI: http://localhost:3001
- API: http://localhost:3000
- API Docs: http://localhost:3000/api-docs (OpenAPI/Swagger)

**Default login:** Use any seeded user email with password `password123`

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

## ❓ FAQ & Troubleshooting

### Authentication

**Q: Which authentication method should I use?**

A: For quick start and self-hosting without email, use password authentication (enabled by default). For production with email capabilities, enable both password and magic links. For maximum security, use magic links + passkeys.

**Q: Can I enable multiple authentication methods?**

A: Yes! Users will be able to choose their preferred method at login. At least one method must be enabled.

**Q: Do I need SMTP to use the application?**

A: No! Password authentication is enabled by default and requires no SMTP configuration. SMTP is only needed if you enable magic link authentication.

**Q: How do I change the default password?**

A: After logging in, users can change their password in the settings. For seed data, edit `apps/api/prisma/seed.ts` before running `npm run db:seed`.

**Q: Magic links aren't working, what should I check?**

A:
1. Verify `AUTH_MAGIC_LINK_ENABLED=true` in `.env`
2. Check all SMTP environment variables are set correctly
3. Look for emails in spam folder
4. Check API logs for SMTP connection errors
5. Test SMTP credentials with a simple mail client first

**Q: WebAuthn/Passkeys require HTTPS, but I'm testing locally?**

A: WebAuthn works with `http://localhost` for development. For other local IPs or domains, you'll need HTTPS (use a reverse proxy with self-signed cert or ngrok).

### Deployment

**Q: Do I need to use Docker?**

A: No, Docker is optional. You can run the API and Web servers natively with Node.js and connect to any PostgreSQL instance.

**Q: What happened to the Caddy reverse proxy?**

A: The built-in reverse proxy was removed to provide flexibility. Use any external reverse proxy (Pangolin, Nginx, Caddy, Traefik, etc.) that fits your infrastructure.

**Q: How do I set up HTTPS?**

A: Configure your external reverse proxy to handle HTTPS/TLS. Point it to:
- Web UI: `http://localhost:3001`
- API: `http://localhost:3000`

See the "Reverse Proxy & HTTPS" section for configuration examples.

**Q: Can I change the port numbers?**

A: Yes, set `PORT` environment variable for the API and configure Vite's port in `apps/web/vite.config.ts` for the web UI.

### Database

**Q: Can I use a managed PostgreSQL service?**

A: Yes! Just set the `DATABASE_URL` environment variable to your managed PostgreSQL connection string.

**Q: How do I backup my data?**

A: Use `pg_dump` to create database backups:
```bash
docker compose exec db pg_dump -U financeuser familyfinance > backup.sql
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

## 📋 Quick Reference

### Port Numbers

| Service    | Port | URL (Development)            |
|------------|------|------------------------------|
| Web UI     | 3001 | http://localhost:3001        |
| API        | 3000 | http://localhost:3000        |
| API Docs   | 3000 | http://localhost:3000/api-docs |
| PostgreSQL | 5432 | localhost:5432               |

### Default Credentials

- **Email:** admin@familyfinance.local (or ola@/lisa@familyfinance.local)
- **Password:** password123

### Authentication Methods

| Method       | Requires SMTP | Requires HTTPS* | Environment Variable         | Default |
|--------------|---------------|-----------------|------------------------------|---------|
| Password     | No            | No              | `AUTH_PASSWORD_ENABLED`      | `true`  |
| Magic Link   | Yes           | No              | `AUTH_MAGIC_LINK_ENABLED`    | `false` |
| Passkey      | No            | Yes**           | `AUTH_PASSKEY_ENABLED`       | `false` |

\* In production
\*\* Works with HTTP on localhost for development

### Common Commands

```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# View logs
npm run docker:logs

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Reset database (⚠️ destructive)
npm run migrate:reset --workspace=apps/api

# Run tests
npm run test --workspace=apps/api

# Open Prisma Studio
npm run studio --workspace=apps/api
```

---

**Made with ❤️ for families who value financial transparency**

For questions or issues, please open an issue on GitHub.
