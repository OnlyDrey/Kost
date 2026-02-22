# Kost — Web App

The React frontend for Kost, a self-hosted shared expense tracker.

## Tech Stack

- **React 18** + TypeScript
- **Vite** — build tool and dev server
- **Tailwind CSS 3** — utility-first styling
- **lucide-react** — icons
- **React Router 6** — client-side routing
- **TanStack Query (React Query)** — server state management
- **i18next** — internationalization (English + Norwegian)
- **Dexie** — IndexedDB for offline cache
- **Workbox** — service worker (cache-first assets, network-first API)
- **Axios** — HTTP client with cookie-based auth

## Getting Started

### Prerequisites

- Node.js 22 LTS
- API container running (see root [README.md](../../README.md))

### Development

```bash
# From project root
npm run dev:web   # starts Vite dev server on http://localhost:3001
```

Vite proxies `/api` requests to `http://localhost:3000` in development.

### Build

```bash
# Type check
npm run type-check --workspace=apps/web

# Production build
npm run build --workspace=apps/web
```

## Project Structure

```
src/
├── components/
│   ├── Invoice/       # AllocationExplanation
│   └── Layout/        # AppLayout (sidebar, nav)
├── hooks/             # React Query hooks (useApi.ts)
├── i18n/              # Translation files (en.json, nb.json)
├── idb/               # IndexedDB offline queue (Dexie)
├── pages/
│   ├── Admin/         # Users, FamilySettings
│   ├── Dashboard/
│   ├── Invoices/      # InvoiceList, InvoiceDetail, AddInvoice
│   ├── Periods/       # PeriodList, PeriodDetail
│   ├── Settings/      # Profile
│   └── Subscriptions/ # SubscriptionList
├── routes/            # App router
├── services/          # API client (axios instance)
├── stores/            # Context providers (auth, settings)
├── sw/                # Service worker entry (Workbox)
└── utils/             # currency, date, distribution helpers
```

## Environment Variables

```env
VITE_API_URL=/api   # API base path — leave as /api (nginx proxies internally)
```

## Features

### Expense Management
- Create, edit, and delete expenses
- Three cost-split methods: **Income-Based**, **Custom %**, **Equal Split**
- Vendor autocomplete with logo support
- Category and payment method dropdowns (managed by admin)

### Payment Tracking
- Register full or partial payments per expense
- Payment status filter (paid / partially paid / unpaid) on invoice list

### Period Statistics
- View total expenses, user shares, and per-category breakdown
- Progress bars showing each category's share of total spend

### Recurring Expenses
- Define subscriptions (monthly / quarterly / yearly)
- Generate invoices for the current period with one click
- Toggle active/inactive without deleting

### User & Family Management (Admin)
- Create, edit, delete users with role assignment (Admin / Adult / Child)
- Upload and remove user avatar photos
- Edit any family member's income directly from the Users page
- Manage categories, payment methods, vendors, and display currency

### Settings
- Light/dark theme toggle
- Language toggle (English / Norwegian)
- Profile photo upload
- Income registration (requires confirmation before saving)
- Password change

### Offline Support (PWA)
- Service worker caches static assets (cache-first) and API responses (network-first)
- Mutations queued in IndexedDB when offline; drained automatically on reconnect
- Installable as a PWA on desktop and mobile

## Internationalization

Translations live in `src/i18n/en.json` and `src/i18n/nb.json`.

- Default fallback language is **Norwegian (Bokmål)**
- Language preference saved to `localStorage`
- All UI strings must use `t('key')` — no hardcoded text

To add a new string: add to both `en.json` and `nb.json` under the appropriate section, then use `t('section.key')` in the component.
