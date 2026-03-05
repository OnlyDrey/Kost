# API Guide (`apps/api`)

## Stack

- NestJS + TypeScript
- Prisma ORM
- PostgreSQL 16
- JWT auth with HTTP-only cookies

## Commands

Run from repository root:

```bash
npm run dev --workspace=apps/api
npm run lint --workspace=apps/api
npm run test --workspace=apps/api
npm run test:e2e --workspace=apps/api
npm run build --workspace=apps/api
```

## Prisma and database workflow

```bash
npm run generate --workspace=apps/api
npm run migrate:deploy --workspace=apps/api
npm run seed --workspace=apps/api
```

Prisma is an active runtime dependency across the API modules and is required for application startup.

## Prisma engine reliability notes

- CI caches Prisma engine artifacts (`~/.cache/prisma`, `node_modules/.prisma`) to reduce repeated engine downloads.
- Keep `npm run generate --workspace=@kost/api` in CI before DB push/tests to ensure client/schema alignment.
- For restricted local environments where Prisma binary endpoints are blocked, verify connectivity to `https://binaries.prisma.sh`.
- If checksum fetch is blocked but you still need local diagnostics, you can try:

```bash
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npm run generate --workspace=apps/api
```

Use that only as a local troubleshooting step; CI should keep full checks enabled.
