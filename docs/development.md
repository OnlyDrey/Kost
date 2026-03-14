# Development Guide

## Prerequisites

- Node.js 20+
- npm 10+
- Docker + Docker Compose v2 (recommended for local database and app parity)

## Install Dependencies

From repository root:

```bash
npm install
```

## Running in Development

Run API:

```bash
npm run dev:api
```

Run web app:

```bash
npm run dev:web
```

Typical local URLs:

- Web (Vite): <http://localhost:5173>
- API: <http://localhost:3000>

## Useful Project Scripts

From repository root:

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

## Project Structure for Contributors

```text
apps/
  api/        Backend modules, Prisma schema, tests
  web/        Frontend pages, components, and state
packages/
  shared/     Shared schemas/types
scripts/      Utility scripts
docs/         Maintainer and advanced-user documentation
```

## Where to Add New Features

- **Backend feature logic**: `apps/api/src/<module>`
- **Database model changes**: `apps/api/prisma/schema.prisma`
- **Frontend pages/components**: `apps/web/src/pages` and `apps/web/src/components`
- **Shared DTO/types/schemas**: `packages/shared/src`

## Testing

Common checks:

```bash
npm run test
npm run lint
npm run typecheck
```

API-specific tests are located in `apps/api/test` and module-level `*.spec.ts` files.
