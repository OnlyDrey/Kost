# UI / State Guardrails (Web)

Developer reference for consistent UI patterns and state behaviour across the Kost web app.

## Terminology

- Use `Total amount` (two words) for total-sum labels/tiles in the English UI.
- Use `Paid` as the status label for fully-paid invoices/expenses.

## Interaction model — Dashboard & Period detail

Dashboard period controls are month-only:

- Show a single `YYYY-MM` selector in Dashboard.
- Default to the latest available month from the fetched period list.
- Global year/month filtering belongs to the Periods page, not Dashboard.
- In header, show only period dropdown + status chip on the same row (no duplicated period text).
- The primary "Add expense" action belongs with the expense section, not the header controls.

## Interaction model — Settings

- Use four primary settings pages: `Profil`, `Passord`, `Brukere`, `Familieinnstillinger`.
- Do not use a top-level selector/dropdown for primary page switching.
- Show a subsection dropdown only inside `Familieinnstillinger`.
- `Profil` and `Passord` pages should show their related cards together on the same page.

Clickable tiles trigger a drill-down or filter action:

| Tile | Action |
|------|--------|
| Your share | Filter invoice list to current user's share |
| Total amount | Show all invoices (reset filter) |
| Paid | Filter to fully-paid invoices |
| Remaining | Filter to unpaid/partially-paid invoices |
| Invoice count | Show all invoices (reset filter) |
| User count | Filter to current user's share |

Clicking a user-share card opens the filtered share view for that user in the selected period.

## Component rules

Use the shared `DistributionUserRow` component (via `UserSelectionCards`) in all contexts where users are selected for cost distribution:

- Expenses (create / edit)
- Recurring subscriptions (create / edit)
- Distribution methods: Equal, Income-based, Custom/fixed

Standard row layout:
1. Avatar (left)
2. Name + @username + role badge
3. Toggle / checkbox (right)
4. Inline input (amount / percent) when applicable

## State rules — Recurring subscriptions

- After saving, invalidate both list and detail cache entries for subscriptions.
- Edit state must be initialised from fresh (non-stale) data when opening or re-opening a form.
- Update flow must be consistent with regular expense editing.

## Design density

- Prefer compact card layout with reduced vertical padding.
- Long vendor names / descriptions: use controlled wrapping / `line-clamp` + `title` attribute for full text on hover.
- The action zone must be stable and must not push critical text out of view.

## Interaction model — Mobile density refinements (2026-02)

- Settings top page buttons must stay on one horizontal row with x-scroll; never wrap to multiple lines on mobile.
- Settings cards use a responsive card grid with consistent gap: one column on mobile, two columns on larger screens.
- Profile card uses a 1/3 (avatar/actions) + 2/3 (inputs) split when space allows, and falls back to stack only on very narrow widths.
- Avatar actions in profile are icon-only round buttons with `aria-label`/`title` and no visible text labels.
- User shares card uses direct user-tile selection; remove the `Din andel` segment toggle and use a disabled/enabled `Reset` action to clear selected user filtering.

## Interaction model — Compact mobile refinements (2026-02)

- Overview header keeps period controls compact: month dropdown should avoid unnecessary width, and the `Åpen/Lukket` status chip must use a rounded-rectangle shape (not pill) with the same visual height family as the period dropdown (`Åpen` = green, `Lukket` = red).
- In the `Andeler` card header, the section title stays left and `Reset` stays right on the same row (`justify-between` + `items-center`).
- Expense/subscription vendor artwork should use a fixed icon/image size that visually balances the vendor + description text block, with `object-contain` and centered alignment.
- Embedded users settings view must show `Brukere` with icon on the left and primary action button on the right in a single aligned header row.


## Runtime resiliency — iOS Safari / PWA

- Keep a root-level error boundary so runtime crashes render a recovery UI instead of a blank page.
- Register global `window` listeners for `error` and `unhandledrejection` and log consistent lifecycle payloads.
- Handle BFCache restores (`pageshow.persisted === true`) by revalidating app state first, with a guarded one-time reload only when the root fails to render.
- Service worker updates must activate safely and force a single controlled reload on `controllerchange` to avoid HTML/chunk mismatches after deploy.
- Startup cache maintenance (Dexie/IndexedDB) must never block app boot; guard startup cleanups with timeout + catch.
