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
- **Utgifter (`/expenses`)**
  - Dedicated selected-period expense page with search/method/category/status filtering.
  - Filter layout: search full-width, `Type` on its own row, and `Kategori` + `Status` on a shared 2-column row.
  - Both `Status` and `Type` filters are dynamic: reset option is always present and other options only appear when currently available in the active dataset.
  - Grouped lists (forfalt/delbetalt/ubetalt/betalt) with responsive card grid: 1 column mobile, 2 columns tablet, 4 columns desktop.
  - `Status` filter includes reset option and only shows statuses available in the active filtered dataset.
- **Faste utgifter (`/subscriptions`)**
  - Recurring expense list and add/edit form with status selector and save/cancel action row.
- **Oppgjør (`/settlement`)**
  - Tabs for overføring, oppgjør, and historikk scoped to selected period.
- **Data (`/import`)**
  - Grouped by data type (Utgifter, Faste utgifter, Oppgjør, Leverandører, Kategorier, Betalingsmåter).
  - Each card exposes direct `Import` + `Eksport`; `Eksport` opens a compact action dialog with only supported options (CSV/JSON/template subset per type).
  - Backup management remains in dedicated backup tab (create/download/restore/delete).
- **Perioder (`/periods`)**
  - Period lifecycle operations, warnings, and related modal flows.

## UI consistency notes

- Use shared controls (`Button`, `AppSelect`, `Input`, `ThemedCheckbox`) for consistent sizing and dark-theme treatment.
- Keep action rows mobile-first: controls should align, share the same control height token, and avoid one-off sizing.
- Add/Edit regular expense forms use an in-form split action row (`Avbryt` / `Lagre`, 50/50 on mobile) since no status field is shown there.
- Fixed expense add/edit forms keep `Status` + `Avbryt` + `Lagre` in one shared top row/container for consistent proportions.
- In Data/backup UI, action colors follow semantics: download (blue), restore (violet), delete (red).

## Navigation order

Sidebar order in the app shell:

1. Oversikt
2. Perioder
3. Utgifter
4. Oppgjør
5. Faste utgifter
6. Data
7. Innstillinger

- Oppgjør historikk rows place transaction actions on the right, and open a shared transaction dialog that supports both amount edit and reverse flow.
- Oppgjør edit/reverse dialog actions use a 50/50 button layout for consistent mobile ergonomics.
