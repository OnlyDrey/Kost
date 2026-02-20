# Architecture

## Tech Stack

**Frontend (`apps/web`)**
- React 18 + TypeScript
- Vite (build tool)
- Material-UI 5
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
│   │   │   ├── periods/        # Period lifecycle
│   │   │   ├── invoices/       # Invoice CRUD + allocation
│   │   │   ├── payments/       # Payment tracking
│   │   │   └── config/         # Configuration
│   │   └── prisma/
│   │       ├── schema.prisma   # Database schema
│   │       ├── migrations/     # Migration history
│   │       └── seed.ts         # Seed data
│   │
│   └── web/                    # React Frontend
│       └── src/
│           ├── pages/          # Route pages
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
Browser → React App (port 3001)
React App → API (port 3000) via HTTP + cookie auth
API → PostgreSQL (port 5432)
```

In production, an external reverse proxy (Nginx, Caddy, Traefik, etc.) handles HTTPS and routes traffic to these services.

## Authentication

- **Password-based** (email + password)
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

| Role    | Permissions                                            |
|---------|--------------------------------------------------------|
| `ADMIN` | Full access: manage users, close periods, delete data  |
| `ADULT` | Create and edit invoices and payments in open periods  |
