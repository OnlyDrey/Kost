# Contributing & Development Guidelines

## Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code; protected — never push directly |
| `develop` | Integration branch for completed features |
| `feature/<short-name>` | Feature work; branch from `develop` |
| `fix/<short-name>` | Bug fixes; branch from `develop` (or `main` for hotfixes) |
| `chore/<short-name>` | Dependency updates, config, tooling |

### Creating a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/add-export-csv
```

---

## Commit Messages

Use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short summary>
```

**Types:**

| Type | When to use |
|------|-------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `chore` | Dependency bumps, config, CI |
| `docs` | Documentation only |
| `refactor` | Code restructure — no behavior change |
| `test` | Add or update tests |
| `style` | Formatting, whitespace — no logic change |

**Examples:**

```
feat(invoices): add CSV export for period
fix(auth): clear stale cookie on 401 response
chore: bump @nestjs/core to 11.1.0
docs: update deployment guide for Traefik
```

Keep the summary under 72 characters. Use imperative mood ("add", not "adds" or "added").

---

## Pull Requests

### Before Opening a PR

1. Rebase onto `develop` and resolve any conflicts
2. Run the full test suite and fix failures:
   ```bash
   npm run test --workspace=apps/api
   npm run type-check --workspace=apps/web
   npm run build
   ```
3. Verify there are no TypeScript errors
4. Confirm all UI strings use `t()` — no hardcoded text

### PR Title

Follow the same Conventional Commits format as commit messages:
```
feat(periods): add category breakdown to period stats
```

### PR Description Template

```markdown
## Summary
- What this PR does (1-3 bullets)

## Changes
- Files added/modified/deleted and why

## Testing
- How to verify the change manually
- Any automated tests added

## Screenshots (if UI change)
<!-- Before / After screenshots -->
```

### PR Review Checklist

**Author:**
- [ ] Self-reviewed the diff
- [ ] No debug logs or commented-out code left in
- [ ] Translations added to both `en.json` and `nb.json`
- [ ] Database migrations are backwards-compatible
- [ ] API changes are documented in Swagger (`@ApiOperation`, etc.)

**Reviewer:**
- [ ] Logic is correct and edge cases are handled
- [ ] No security regressions (SQL injection, auth bypass, IDOR)
- [ ] Existing tests still pass; new tests added for new behavior
- [ ] UI changes look reasonable in both light and dark mode

---

## Development Setup

See [SETUP.md](../SETUP.md) for full environment setup.

### Running Locally (Without Docker)

```bash
# Start only the database
docker compose up -d db

# Set environment
export DATABASE_URL=postgresql://kostuser:kostpass@localhost:5432/kost

# Install dependencies
npm install

# Generate Prisma client and apply migrations
npm run generate --workspace=apps/api
npm run migrate --workspace=apps/api

# Start both servers
npm run dev:api   # terminal 1 — API on :3000
npm run dev:web   # terminal 2 — Web on :3001
```

### Running Tests

```bash
# API unit/integration tests
npm run test --workspace=apps/api

# Type checking (web)
npm run type-check --workspace=apps/web

# Full build check
npm run build
```

### Prisma Migrations

When changing the database schema:

```bash
# Create a new migration (development)
npx prisma migrate dev --name describe_your_change --schema apps/api/prisma/schema.prisma

# Apply migrations in the running API container (production/staging)
npm run db:migrate
```

Migrations are applied automatically on `npm run db:migrate` which runs `prisma migrate deploy` inside the API container.

---

## Code Style

- **TypeScript strict mode** — no `any` unless absolutely necessary; prefer explicit types
- **No hardcoded UI strings** — use `t('section.key')` from i18next for all displayed text; update both `en.json` and `nb.json`
- **Money in cents** — all monetary values stored and computed as integer cents; use `amountToCents` / `centsToAmount` / `formatCurrency` utilities
- **Dates as ISO strings** — store as `YYYY-MM-DD`; display with `formatDate()`
- **React Query for data** — use existing hooks from `useApi.ts`; invalidate queries after mutations
- **No floating-point arithmetic** for money — see [allocation-rules.md](./allocation-rules.md)

---

## Adding a New Page / Feature

1. **API** — add a NestJS module in `apps/api/src/<feature>/`, register it in `AppModule`
2. **Prisma** — add model to `schema.prisma`, create migration
3. **Shared types** — add to `packages/shared/src/` if shared between frontend and backend
4. **API hooks** — add `useQuery`/`useMutation` hooks to `apps/web/src/hooks/useApi.ts`
5. **Page** — create `apps/web/src/pages/<Feature>/` component
6. **Route** — register in `apps/web/src/routes/`
7. **Nav** — add to `NAV_ITEMS` in `AppLayout.tsx` if it needs a sidebar link
8. **i18n** — add translation keys to both `en.json` and `nb.json`

---

## Security Notes

- Never commit secrets (`.env`, credentials, JWT keys) — `.gitignore` covers `.env`
- All API endpoints require authentication (`@UseGuards(JwtAuthGuard)`) except `/auth/login`
- Admin-only endpoints use the `isAdmin` role check
- File uploads are validated by file type and size (max 5 MB) using multer interceptors
- HTTP-only cookies prevent XSS token theft; `SameSite=Strict` in production prevents CSRF
