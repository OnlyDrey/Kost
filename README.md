<p align="center">
  <img src="apps/web/public/logo-mark.svg" alt="Kost logo" width="96" />
</p>
<h1 align="center">Kost</h1>

<p align="center">Self-hosted shared expense tracking for households.</p>

## Overview

Kost is a monorepo for a household finance PWA:

- **Web app**: React 18 + Vite + TypeScript + Tailwind
- **API**: NestJS + Prisma + PostgreSQL 16
- **Shared package**: cross-app types and schemas

The default deployment is Docker-first, running PostgreSQL and a single app container serving both API (`/api`) and the built web app (`/`).

## Product modules (current UI)

Main app modules in the PWA today:

- **Oversikt**: period selector, status badge, summary cards, shares, and category views.
- **Utgifter**: add/edit invoices, payment tracking, filtering and status views.
- **Faste utgifter**: recurring expense rules, status control (`Aktiv`, `Satt på pause`, `Avsluttet`) and period generation.
- **Oppgjør**: transfer registration, settlement planning, and history per period.
- **Data**: import, export, and local backup/restore workflows.
- **Perioder**: create, close, reopen, and delete period lifecycle actions.

Data module capabilities currently include:

- Import of expenses/recurring expenses from spreadsheet files.
- Import of vendors/categories/payment methods from simple files.
- Export of expenses, recurring expenses, settlement data, and masterdata (CSV/JSON).
- Manual and automatic local backups with restore preview and restore action.

## Repository structure

```text
apps/
  api/        NestJS backend, Prisma schema, tests
  web/        React frontend (PWA)
packages/
  shared/     Shared TypeScript types/schemas
scripts/      Repository-level utility scripts
docs/         Project documentation
```

## Prerequisites

- **Node.js** `>=20`
- **npm** `>=10`
- **Docker Engine + Docker Compose v2** (recommended for local/prod parity)

## Local setup

```bash
git clone https://github.com/OnlyDrey/Kost.git
cd Kost
cp .env.example .env
npm ci --workspaces --include-workspace-root
```

Required before first real run:

- `JWT_SECRET`
- `BOOTSTRAP_ADMIN_PASSWORD`

## Run locally

### Docker (recommended)

```bash
docker compose up --build
```

- App: <http://localhost:3000>
- Health: <http://localhost:3000/api/health>
- API docs: <http://localhost:3000/api/docs>

### Non-Docker development

```bash
npm run dev:api
npm run dev:web
```

## Scripts

### Root scripts

- `npm run dev:api` – run API in watch mode
- `npm run dev:web` – run Vite dev server
- `npm run lint` – lint all workspaces
- `npm run test` – run workspace tests
- `npm run typecheck` – typecheck workspaces that expose a `typecheck` script
- `npm run build` – build all workspaces
- `npm run docker:up` / `npm run docker:down` – compose lifecycle
- `npm run doctor` – optional local environment/system check

### Workspace highlights

- `apps/api`: `dev`, `build`, `test`, `test:e2e`, `generate`, `db:push`, `seed`
- `apps/web`: `dev`, `build`, `lint`, `typecheck`
- `packages/shared`: `build`

## Documentation

- [Documentation index](docs/index.md)
- [System overview](docs/overview.md)
- [Setup and deployment](docs/setup-and-deployment.md) (includes Docker mirror/build-cache guidance)
- [Operations runbook](docs/operations.md)
- [Web app guide](docs/web-app.md)
- [API guide](docs/api.md)
- [Design tokens](docs/design-tokens.md)
- [Contributing](docs/contributing.md)
