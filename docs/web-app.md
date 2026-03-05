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
