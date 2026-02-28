# Blank Screen RCA (Offline, Diff-Only)

## A) Evidence availability

- **CANONICAL_DIFF_PATH:** `docs/migration/1.diff`
- **Selection rule applied:** largest `*.diff` in `docs/migration`.

### Step 0 command outputs (verbatim)

#### 1) Repo root and docs/migration contents

```bash
$ pwd
/workspace/Kost
$ ls -la
total 772
drwxr-xr-x   9 root root   4096 Feb 28 18:55 .
drwxr-xr-x   3 root root   4096 Feb 28 17:33 ..
-rw-r--r--   1 root root    660 Feb 28 17:33 .dockerignore
-rw-r--r--   1 root root    912 Feb 28 17:33 .env.example
drwxr-xr-x   8 root root   4096 Feb 28 18:55 .git
drwxr-xr-x   3 root root   4096 Feb 28 17:33 .github
-rw-r--r--   1 root root    362 Feb 28 17:33 .gitignore
drwxr-xr-x   3 root root   4096 Feb 28 17:35 .husky
-rw-r--r--   1 root root     34 Feb 28 17:33 .npmrc
-rw-r--r--   1 root root      3 Feb 28 17:33 .nvmrc
-rw-r--r--   1 root root   2109 Feb 28 17:33 Dockerfile
-rw-r--r--   1 root root   5985 Feb 28 18:55 MIGRATION_PLAN.md
-rw-r--r--   1 root root    375 Feb 28 17:33 Makefile
-rw-r--r--   1 root root   6582 Feb 28 17:33 README.md
-rw-r--r--   1 root root  11444 Feb 28 17:33 ROUNDING_ALLOCATION_RULES.md
-rw-r--r--   1 root root   9934 Feb 28 17:33 SETUP.md
drwxr-xr-x   4 root root   4096 Feb 28 17:33 apps
-rw-r--r--   1 root root   6156 Feb 28 17:33 check-system.sh
-rw-r--r--   1 root root   2154 Feb 28 17:33 docker-compose.yml
drwxr-xr-x   3 root root   4096 Feb 28 18:55 docs
drwxr-xr-x 708 root root  24576 Feb 28 17:35 node_modules
-rw-r--r--   1 root root 636084 Feb 28 17:33 package-lock.json
-rw-r--r--   1 root root   2162 Feb 28 17:33 package.json
drwxr-xr-x   3 root root   4096 Feb 28 17:33 packages
-rw-r--r--   1 root root    519 Feb 28 17:33 tsconfig.base.json
$ find docs -maxdepth 3 -type f | sed -n '1,200p'
docs/contributing.md
docs/migration/1.patch
docs/migration/1.diff
docs/architecture.md
docs/deployment.md
docs/ui-state-guardrails.md
docs/AUDIT.md
docs/database.md
docs/branding.md
docs/TROUBLESHOOTING.md
$ ls -la docs/migration || true
total 276
drwxr-xr-x 2 root root   4096 Feb 28 18:55 .
drwxr-xr-x 3 root root   4096 Feb 28 18:55 ..
-rw-r--r-- 1 root root 132566 Feb 28 18:55 1.diff
-rw-r--r-- 1 root root 138105 Feb 28 18:55 1.patch
```

#### 2) Diff/Patch file discovery

```bash
$ find . -maxdepth 6 -type f \( -iname '*.diff' -o -iname '*.patch' \) | sed -n '1,200p'
./docs/migration/1.patch
./docs/migration/1.diff
```

#### 3) Size/keyword fallback search

```bash
$ find docs/migration -maxdepth 2 -type f -size +10k -print || true
docs/migration/1.patch
docs/migration/1.diff
$ grep -RIl --maxdepth=3 "diff --git" docs/migration || true
grep: unrecognized option '--maxdepth=3'
Usage: grep [OPTION]... PATTERNS [FILE]...
Try 'grep --help' for more information.
```

---

## Step 2 parse results

### Changed file list (`diff --git a/... b/...`)

```text
.env.example
.github/workflows/ci.yml
Dockerfile
apps/api/package.json
apps/api/prisma/migrations/20260213000000_init/migration.sql
apps/api/prisma/migrations/20260221000000_add_family_categories_payment_method/migration.sql
apps/api/prisma/migrations/20260221000001_move_payment_method_to_invoice/migration.sql
apps/api/prisma/migrations/20260221000002_add_vendor_and_currency/migration.sql
apps/api/prisma/migrations/20260221000003_add_user_avatar/migration.sql
apps/api/prisma/migrations/20260222000000_subscription_specialization/migration.sql
apps/api/prisma/migrations/20260223000000_add_personal_invoice_privacy/migration.sql
apps/api/prisma/migrations/20260223000001_add_2fa_fields/migration.sql
apps/api/prisma/migrations/20260227000000_rename_junior_to_child/migration.sql
apps/api/prisma/migrations/20260227000001_add_currency_symbol_position/migration.sql
apps/api/prisma/schema.prisma
apps/api/prisma/seed.ts
apps/api/scripts/docker-entrypoint.sh
apps/api/src/app.module.ts
apps/api/src/auth/dto/delete-account.dto.ts
apps/api/src/auth/dto/password-login.dto.ts
apps/api/src/auth/dto/password-register.dto.ts
apps/api/src/config/configuration.ts
apps/api/src/family/family.controller.ts
apps/api/src/health/health.controller.ts
apps/api/src/incomes/dto/create-income.dto.ts
apps/api/src/invoices/dto/add-payment.dto.ts
apps/api/src/invoices/dto/create-invoice.dto.ts
apps/api/src/invoices/invoices.service.ts
apps/api/src/main.ts
apps/api/src/periods/dto/create-period.dto.ts
apps/api/src/periods/period-closing.service.ts
apps/api/src/periods/periods.controller.ts
apps/api/src/subscriptions/dto/create-subscription.dto.ts
apps/api/src/users/dto/create-user.dto.ts
apps/api/src/users/users.controller.ts
apps/api/test/app.e2e-spec.ts
apps/api/tsconfig.json
apps/web/index.html
apps/web/nginx.conf
apps/web/package.json
apps/web/public/theme-init.js
apps/web/src/hooks/queryKeys.ts
apps/web/src/hooks/useApi.ts
apps/web/src/hooks/useAuthApi.ts
apps/web/src/hooks/useFamilyApi.ts
apps/web/src/hooks/useIncomeApi.ts
apps/web/src/hooks/useInvoiceApi.ts
apps/web/src/hooks/usePaymentApi.ts
apps/web/src/hooks/usePeriodApi.ts
apps/web/src/hooks/useSubscriptionApi.ts
apps/web/src/hooks/useUserApi.ts
apps/web/src/main.tsx
apps/web/src/pages/Expenses/AddExpense.tsx
apps/web/src/pages/Invoices/AddInvoice.tsx
apps/web/src/pages/Invoices/InvoiceList.tsx
apps/web/src/pages/Login.tsx
apps/web/src/routes/index.tsx
apps/web/src/stores/auth.context.tsx
apps/web/src/vite-env.d.ts
apps/web/tsconfig.json
apps/web/vite.config.ts
docker-compose.yml
docs/TROUBLESHOOTING.md
docs/deployment.md
package-lock.json
tsconfig.base.json
```

### Counts

- **total files changed:** 66
- **apps/web files changed:** 24
- **apps/api files changed:** 34
- **other paths:** 8

### Web boot-chain related files found in diff

- **entry/bootstrap:** `apps/web/src/main.tsx`, `apps/web/index.html`
- **routing:** `apps/web/src/routes/index.tsx`, `apps/web/src/pages/Login.tsx`
- **auth/session:** `apps/web/src/stores/auth.context.tsx`, `apps/web/src/hooks/useAuthApi.ts`
- **API client layer:** `apps/web/src/hooks/useApi.ts`, plus new domain hook files (`useInvoiceApi.ts`, `usePeriodApi.ts`, `useFamilyApi.ts`, etc.)
- **env/config:** `apps/web/src/main.tsx` (`VITE_ENABLE_PWA`), `apps/web/src/vite-env.d.ts`
- **build/hosting:** `apps/web/vite.config.ts`, `apps/web/nginx.conf`, `apps/web/index.html`
- **service worker/PWA:** `apps/web/src/main.tsx`, `apps/web/vite.config.ts`, `apps/web/public/theme-init.js`, `apps/web/index.html`

---

## B) Boot-chain map (from diff evidence)

1. **Entry document** → `apps/web/index.html` still contains early theme script and external Google Fonts links (comment cleanup shown in diff).  
2. **Root bootstrap** → `apps/web/src/main.tsx` now adds `VITE_ENABLE_PWA` gate and SW unregistration/cache cleanup + reload branch when PWA is disabled.  
3. **Providers** → React Query/Auth providers are still rooted from `main.tsx` (no provider removal shown; only lifecycle hardening hunk changed).  
4. **Router** → `apps/web/src/routes/index.tsx` catch-all behavior changed from forced `/login` to conditional `CatchAll()` using auth/loading state.  
5. **Auth init** → `apps/web/src/stores/auth.context.tsx` changed `getCurrentUser()` flow to include `.catch(...setUser(null))` and `.finally(setIsLoading(false))`.  
6. **API client/hooks** → `apps/web/src/hooks/useApi.ts` transformed into barrel re-export to many new per-domain files; import graph changed significantly.  
7. **Env/build config** → `apps/web/vite.config.ts` changed Workbox runtime caching and set `build.modulePreload.polyfill = false`.  
8. **Hosting/security headers** → `apps/web/nginx.conf` added strict CSP and related headers in many locations.  
9. **SW/PWA resources** → `apps/web/public/theme-init.js` added as external file, but `index.html` hunk still shows inline theme script area in changed region.

---

## C) Ranked hypotheses

### HIGH-1: CSP blocks required startup script/module path (Document failure or immediate runtime bootstrap failure)
- **Symptom type:** Document failure / runtime bootstrap blocked before React mounts.
- **Evidence from diff hunks:**
  - `apps/web/nginx.conf`: adds strict `Content-Security-Policy` broadly with `script-src 'self'` (no explicit inline allowance) and applies on `/`, `/index.html`, static assets, and manifest locations.
  - `apps/web/index.html`: diff section includes inline `<script>` block for theme init area; strict CSP + inline script mismatch is plausible.
- **Runtime signal to confirm:** browser console CSP violations (`Refused to execute inline script...` or blocked module/script), document loads but React root never mounts.

#### Fix Attempt 01: pending runtime confirmation
- Applied a temporary diagnostic CSP change in `apps/web/nginx.conf` to allow inline startup scripts while preserving strict non-script directives.
- **Runtime signal to look for:** CSP violations for inline/module scripts disappear and React root mounts (login UI visible).

### HIGH-2: module preload behavior change breaks chunk loading on target browser (Chunk 404/asset path failure or module init failure)
- **Symptom type:** Chunk load failure / runtime crash after initial HTML loads.
- **Evidence from diff hunks:**
  - `apps/web/vite.config.ts`: `build.modulePreload: { polyfill: false }` newly added.
  - Same file modifies PWA/runtime caching set; combined with preload behavior can surface browser-specific module load issues.
- **Runtime signal to confirm:** network panel shows failed module/chunk requests, console shows dynamic import/modulepreload related errors.

### HIGH-3: Catch-all + auth loading logic can dead-end in spinner/redirect loop (Auth/route loop preventing UI)
- **Symptom type:** Route loop or indefinite loading-like blank state.
- **Evidence from diff hunks:**
  - `apps/web/src/routes/index.tsx`: wildcard route now delegates to `CatchAll()` using `isAuthenticated` + `isLoading`; prior unconditional `/login` removed.
  - `apps/web/src/pages/Login.tsx`: redirects changed from `/dashboard` to `/overview`.
  - If `/overview` route mismatch or auth state remains unresolved, catch-all can keep user from a stable rendered page.
- **Runtime signal to confirm:** repeated navigation between wildcard/login/overview routes or spinner persists; no hard JS exception.

### MED-1: SW cleanup/reload hardening causes reload churn or stale state transitions (SW/cache stale assets)
- **Symptom type:** SW/cache-related stale shell or repeated reload behavior leading to apparent blank page.
- **Evidence from diff hunks:**
  - `apps/web/src/main.tsx`: new disabled-PWA branch unregisters SW, deletes workbox/navigation caches, conditionally reloads using session key guard.
- **Runtime signal to confirm:** console logs `[AppLifecycle] PWA disabled...`, frequent reloads, service worker controller transitions around blank screen.

### MED-2: Hook-layer refactor introduces runtime import/export mismatch (Runtime crash after chunks load)
- **Symptom type:** runtime TypeError/undefined hook function causing render crash.
- **Evidence from diff hunks:**
  - `apps/web/src/hooks/useApi.ts`: huge rewrite from implementation file to barrel re-exports.
  - Multiple new files (`useAuthApi.ts`, `useFamilyApi.ts`, `useIncomeApi.ts`, etc.) added/changed simultaneously.
- **Runtime signal to confirm:** console stack trace like `... is not a function` in pages/components using migrated hooks.

### LOW-1: External font/CSS source blocked by tightened CSP degrades styling but not full blank
- **Symptom type:** visual degradation (unstyled text), unlikely total blank.
- **Evidence from diff hunks:**
  - `apps/web/index.html` still includes `fonts.googleapis.com`/`fonts.gstatic.com` resources.
  - `apps/web/nginx.conf` CSP `style-src 'self' 'unsafe-inline'` and `font-src 'self' data:` do not allow Google-hosted CSS/fonts.
- **Runtime signal to confirm:** CSP warnings for fonts/styles but app still functionally renders.

---

## D) Top suspect files (Top 10)

1. **`apps/web/nginx.conf`**  
   - Why suspect: broad CSP/security header rollout can block startup scripts/modules.  
   - Inspect first: console CSP errors; response headers for `/` and `/index.html`.  
   - Supports: HIGH-1, LOW-1.

2. **`apps/web/vite.config.ts`**  
   - Why suspect: module preload polyfill disabled + PWA/runtime cache strategy edits.  
   - Inspect first: failed `modulepreload`/chunk requests; browser compatibility signals.  
   - Supports: HIGH-2, MED-1.

3. **`apps/web/src/main.tsx`**  
   - Why suspect: SW disable/unregister/cache-delete/reload branch added in app bootstrap.  
   - Inspect first: lifecycle console logs; repeated reload or controllerchange events.  
   - Supports: MED-1, HIGH-1 (if bootstrap interrupted).

4. **`apps/web/src/routes/index.tsx`**  
   - Why suspect: wildcard route semantics changed to auth-dependent logic.  
   - Inspect first: current pathname transitions; whether spinner from `isLoading` persists.  
   - Supports: HIGH-3.

5. **`apps/web/src/stores/auth.context.tsx`**  
   - Why suspect: async init flow altered; loading state now resolved in `finally` (good fix but critical path).  
   - Inspect first: auth init promise resolution/rejection; `isLoading` flip timing.  
   - Supports: HIGH-3.

6. **`apps/web/src/pages/Login.tsx`**  
   - Why suspect: redirect target changed `/dashboard` → `/overview`; route mismatch can trap navigation.  
   - Inspect first: existence/accessibility of `/overview` route after login.  
   - Supports: HIGH-3.

7. **`apps/web/src/hooks/useApi.ts`**  
   - Why suspect: major refactor to barrel exports can hide missing/renamed symbols.  
   - Inspect first: runtime errors for undefined hooks imported via legacy path.  
   - Supports: MED-2.

8. **`apps/web/src/hooks/useAuthApi.ts`**  
   - Why suspect: newly added module in refactor chain; potential export mismatch or tree errors.  
   - Inspect first: import resolution and hook call stacks on auth screens.  
   - Supports: MED-2.

9. **`apps/web/index.html`**  
   - Why suspect: still includes inline script region; strict CSP may block it if policy active.  
   - Inspect first: whether any inline script violation appears before React mount.  
   - Supports: HIGH-1.

10. **`apps/web/public/theme-init.js`**  
   - Why suspect: introduced as CSP-friendly external alternative, indicating active transition in theme-init strategy.  
   - Inspect first: whether file is actually loaded/linked and if CSP allows it.  
   - Supports: HIGH-1, LOW-1.

---

## Notes
- This RCA is **offline and diff-only**; it is intentionally evidence-backed by local patch hunks, not runtime execution.
- Several hypotheses are marked as requiring runtime logs for confirmation.
