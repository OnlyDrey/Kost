# Profilering plan (incremental)

## Goal

Introduce a controlled Profilering system that centralizes theme colors through CSS variables + Tailwind semantic tokens, while reducing direct palette usage over time.

## Phase 0 — Token contract + wiring (foundation)

### Changes

- Keep global RGB token contract in `apps/web/src/index.css`.
- Keep Tailwind semantic color mapping in `apps/web/tailwind.config.js`.
- Keep a centralized Tailwind 500 primary-family map in `apps/web/src/theme/primaryColorFamilies.ts`.

### Acceptance criteria

- Semantic classes are available (`bg-primary`, `text-text-secondary`, `border-border`, `ring-focus`, etc.).
- Primary branding color can be swapped by updating `--color-primary` from the centralized map.

### Verification

- `npm run -w apps/web type-check`
- `npm run -w apps/web lint`
- Spot check: select multiple primary families in Profilering and verify immediate app tint update.

### Risk / rollback

- Low risk. Roll back by restoring previous token values and preset map.

## Phase 1 — Shared primitives first

### Changes

- Ensure shared primitives (button/dialog/tag/action icons/select inputs) use semantic tokens only.
- Keep confirm dialog button semantics: primary by default, neutral cancel, danger only for delete actions.

### Acceptance criteria

- No direct `*-500` family classes in migrated primitives.
- Confirm dialogs are consistent and use shared `ConfirmDialogProvider`.

### Verification

- Run `npm run check:color-guard` (advisory).
- Keyboard/focus checks for dialog and custom color dropdown.

### Risk / rollback

- Medium risk (cross-cutting visual changes). Roll back per primitive component commit.

## Phase 2 — High-usage pages migration

### Changes

- Migrate top color-heavy pages from audit (FamilySettings, PeriodList, Users, Profile).
- Replace direct palette families with semantic tokens.

### Acceptance criteria

- Visual meaning is preserved (success/danger/warning/neutral).
- No raw hex additions in touched files.

### Verification

- Grep for direct palette classes in touched files.
- Manual UI smoke on Settings, Periods, Admin pages.

### Risk / rollback

- Medium/high risk. Roll back page-by-page.

## Phase 3 — Cleanup + enforcement tightening

### Changes

- Remove remaining direct palette usage from app code.
- Move guardrail script from advisory to strict in CI for `apps/web/src/components` and migrated pages.

### Acceptance criteria

- New PRs cannot add raw hex/direct palette classes in migrated scope.

### Verification

- `STRICT_COLOR_GUARD=1 npm run check:color-guard`

### Risk / rollback

- Low runtime risk; mostly developer workflow impact.

## Logo lifecycle + icon generation

- Upload: image file is converted to base64 and stored in `settings.branding.logoDataUrl` (localStorage via settings store).
- Replace: selecting a new file overwrites the previous stored logo.
- Delete: clearing `logoDataUrl` restores default logo fallback.
- Boot: branding is applied early (`applyStoredBrandingEarly`) before React mount to reduce flash.
- Unified icon runtime:
  - Header logo source comes from the same branding resolver as favicon/app icon.
  - Favicon/apple-touch-icon are regenerated at runtime using canvas with:
    - foreground: current logo source
    - background: `branding.appIconBackground` hex (or default)
