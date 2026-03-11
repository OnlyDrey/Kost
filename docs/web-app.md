# Web App Guide (`apps/web`)

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- React Router
- TanStack Query
- i18next (English + Norwegian)
- Dexie (offline queue)
- Workbox (PWA support)

## Commands

Run from repository root:

```bash
npm run dev:web
npm run lint --workspace=apps/web
npm run typecheck --workspace=apps/web
npm run build --workspace=apps/web
```

## Notes

- In development, Vite proxies `/api` to the backend.
- Keep UI text in i18n translation files (`src/i18n/en.json` and `src/i18n/nb.json`).
- Prefer existing shared UI components before adding new variants.

## Current page/module map

- **Oversikt (`/overview`)**
  - Period picker + period status badge.
  - Summary cards and share/category breakdowns for the selected period.
- **Utgifter (`/invoices`)**
  - Invoice list + filters, detail pages, add/edit form, payment state handling.
- **Faste utgifter (`/subscriptions`)**
  - Recurring expense list and add/edit form with status selector and save/cancel action row.
- **Oppgjør (`/settlement`)**
  - Tabs for overføring, oppgjør, and historikk scoped to selected period.
- **Data (`/import`)**
  - Import cards, export cards, and backup management (create/download/restore/delete).
- **Perioder (`/periods`)**
  - Period lifecycle operations, warnings, and related modal flows.

## UI consistency notes

- Use shared controls (`Button`, `AppSelect`, `Input`, `ThemedCheckbox`) for consistent sizing and dark-theme treatment.
- Keep action rows mobile-first: controls should align, share the same control height token, and avoid one-off sizing.
- In Data/backup UI, action colors follow semantics: download (blue), restore (violet), delete (red).
