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
