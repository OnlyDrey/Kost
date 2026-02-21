# Architecture

## Tech Stack

**Frontend (`apps/web`)**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS 3
- lucide-react (icons)
- React Router 6
- React Query (TanStack)
- i18next (English + Norwegian)
- Dexie (IndexedDB for offline cache)
- Workbox (service worker)

**Backend (`apps/api`)**
- Node.js 22 + TypeScript
- NestJS framework
- Prisma ORM
- PostgreSQL 16
- Passport + JWT (HTTP-only cookies)

**Shared (`packages/shared`)**
- Common TypeScript types and Zod schemas

**Infrastructure**
- Docker + Docker Compose V2
- GitHub Actions (CI/CD)

## Project Structure

```
kost/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/           # Authentication (password-based)
│   │   │   ├── users/          # User management
│   │   │   ├── family/         # Family settings (categories, payment methods, currency, vendors)
│   │   │   ├── periods/        # Period lifecycle
│   │   │   ├── invoices/       # Expense CRUD + allocation
│   │   │   ├── payments/       # Payment tracking
│   │   │   ├── subscriptions/  # Recurring expenses; invoice generation per period
│   │   │   └── config/         # Configuration
│   │   └── prisma/
│   │       ├── schema.prisma   # Database schema
│   │       ├── migrations/     # Migration history
│   │       └── seed.ts         # Seed data
│   │
│   └── web/                    # React Frontend
│       └── src/
│           ├── pages/          # Route pages (Dashboard, Invoices, Subscriptions, Periods, Settings, Admin)
│           ├── components/     # Reusable components
│           ├── services/       # API client (axios, cookie-based auth)
│           ├── stores/         # Context providers (auth, settings)
│           ├── hooks/          # Custom React Query hooks
│           ├── i18n/           # Translation files (en, nb)
│           ├── sw/             # Service worker (Workbox)
│           └── idb/            # IndexedDB offline queue (Dexie)
│
├── packages/
│   └── shared/                 # Shared types and schemas
│
├── docs/                       # Documentation
├── docker-compose.yml
└── README.md
```

## Service Communication

```
Browser → nginx / React App (port 3001)
nginx → API (port 3000) for /api/* requests
API → PostgreSQL (port 5432)
```

The nginx container in the web service proxies all `/api/*` requests to the API container internally, so browsers only ever talk to port 3001. In production, an external reverse proxy (Nginx, Caddy, Traefik, etc.) only needs to expose port 3001 over HTTPS.

## Authentication

- **Password-based** (username + password)
- JWT issued after login, stored in **HTTP-only cookie** (not localStorage)
- Frontend uses `withCredentials: true` on all API requests so the cookie is sent automatically
- Cookie is `SameSite=Lax` in dev, `SameSite=Strict` in production

## Offline Support

The web app is a Progressive Web App (PWA) that works offline:
- Service worker caches static assets (cache-first) and API responses (network-first)
- Create/update/delete operations while offline are queued in IndexedDB
- The queue is drained automatically when the connection is restored

## Money Handling

All monetary amounts are stored and calculated as **integers in cents (øre)**. No floating-point arithmetic is used anywhere. See [allocation-rules.md](./allocation-rules.md) for details on how cost splits are calculated.

## Roles

| Role     | Permissions                                                                |
|----------|----------------------------------------------------------------------------|
| `ADMIN`  | Full access: manage users, family settings, close periods, delete data; can view and override any user's income for the current period |
| `ADULT`  | Create and edit invoices and payments in open periods; register own income (requires confirmation) |
| `JUNIOR` | Child role; excluded from cost splits by default, must be opted in per invoice |
