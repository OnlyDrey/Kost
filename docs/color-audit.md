# Color Audit Report

## Scope
- Repository-wide scan for Tailwind color classes, arbitrary Tailwind values, and raw CSS color values/theme definitions.
- This report reflects the repository **after** the mechanical `*-600 -> *-500` replacement for approved Tailwind utilities.

## Summary

### Usage type counts

| Usage type | Count |
|---|---:|
| Tailwind class | 1606 |
| Theme/token definitions | 44 |
| Raw CSS value | 33 |
| Arbitrary Tailwind value | 4 |

### Tailwind family counts (post-replacement)

| Family | Count |
|---|---:|
| gray | 908 |
| indigo | 279 |
| red | 193 |
| green | 97 |
| amber | 88 |
| sky | 11 |
| slate | 11 |
| violet | 8 |
| emerald | 4 |
| orange | 2 |
| offset | 1 |

## Unique Tailwind color references

| Representation | Usage category | Top locations (file=count) |
|---|---|---|
| `[11px]` | text:1 | apps/web/src/pages/Invoices/InvoiceList.tsx=1 |
| `[15px]` | text:1 | apps/web/src/components/Expense/ExpenseItemCard.tsx=1 |
| `[2rem]` | text:1 | apps/web/src/pages/Invoices/InvoiceDetail.tsx=1 |
| `[clamp(1.5rem,2.2vw,1.9rem)]` | text:1 | apps/web/src/pages/Overview/Overview.tsx=1 |
| `amber-100` | bg:6 | apps/web/src/components/Distribution/DistributionUserRow.tsx=1, apps/web/src/pages/Overview/Overview.tsx=1, apps/web/src/pages/Admin/Users.tsx=1, apps/web/src/pages/Invoices/InvoiceList.tsx=1, apps/web/src/pages/Periods/PeriodDetail.tsx=1, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1 |
| `amber-200` | border:7 | apps/web/src/pages/Admin/FamilySettings.tsx=2, apps/web/src/pages/Overview/Overview.tsx=1, apps/web/src/pages/Invoices/AddInvoice.tsx=1, apps/web/src/pages/Invoices/InvoiceList.tsx=1, apps/web/src/pages/Periods/PeriodDetail.tsx=1, apps/web/src/pages/Expenses/AddExpense.tsx=1 |
| `amber-300` | text:5 | apps/web/src/pages/Admin/FamilySettings.tsx=2, apps/web/src/components/Distribution/DistributionUserRow.tsx=1, apps/web/src/pages/Admin/Users.tsx=1, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1 |
| `amber-400` | text:16 | apps/web/src/pages/Invoices/AddInvoice.tsx=5, apps/web/src/pages/Expenses/AddExpense.tsx=4, apps/web/src/pages/Overview/Overview.tsx=2, apps/web/src/pages/Invoices/InvoiceList.tsx=2, apps/web/src/pages/Periods/PeriodDetail.tsx=2, apps/web/src/pages/Admin/Users.tsx=1 |
| `amber-400/80` | text:3 | apps/web/src/pages/Overview/Overview.tsx=1, apps/web/src/pages/Invoices/InvoiceList.tsx=1, apps/web/src/pages/Periods/PeriodDetail.tsx=1 |
| `amber-50` | bg:4 | apps/web/src/pages/Admin/FamilySettings.tsx=2, apps/web/src/pages/Invoices/AddInvoice.tsx=1, apps/web/src/pages/Expenses/AddExpense.tsx=1 |
| `amber-500` | text:14, bg:3 | apps/web/src/pages/Invoices/AddInvoice.tsx=5, apps/web/src/pages/Expenses/AddExpense.tsx=5, apps/web/src/pages/Overview/Overview.tsx=2, apps/web/src/pages/Periods/PeriodDetail.tsx=2, apps/web/src/pages/Dashboard.tsx=1, apps/web/src/pages/Admin/Users.tsx=1, apps/web/src/pages/Invoices/InvoiceList.tsx=1 |
| `amber-700` | text:13 | apps/web/src/pages/Overview/Overview.tsx=2, apps/web/src/pages/Admin/FamilySettings.tsx=2, apps/web/src/pages/Invoices/InvoiceList.tsx=2, apps/web/src/pages/Periods/PeriodDetail.tsx=2, apps/web/src/components/Distribution/DistributionUserRow.tsx=1, apps/web/src/pages/Admin/Users.tsx=1, apps/web/src/pages/Invoices/AddInvoice.tsx=1, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1 |
| `amber-800` | border:4 | apps/web/src/pages/Admin/FamilySettings.tsx=2, apps/web/src/pages/Invoices/AddInvoice.tsx=1, apps/web/src/pages/Expenses/AddExpense.tsx=1 |
| `amber-900/20` | bg:4 | apps/web/src/pages/Admin/FamilySettings.tsx=2, apps/web/src/pages/Invoices/AddInvoice.tsx=1, apps/web/src/pages/Expenses/AddExpense.tsx=1 |
| `amber-900/30` | bg:6 | apps/web/src/components/Distribution/DistributionUserRow.tsx=1, apps/web/src/pages/Overview/Overview.tsx=1, apps/web/src/pages/Admin/Users.tsx=1, apps/web/src/pages/Invoices/InvoiceList.tsx=1, apps/web/src/pages/Periods/PeriodDetail.tsx=1, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1 |
| `amber-900/50` | border:3 | apps/web/src/pages/Overview/Overview.tsx=1, apps/web/src/pages/Invoices/InvoiceList.tsx=1, apps/web/src/pages/Periods/PeriodDetail.tsx=1 |
| `emerald-500` | bg:3, text:1 | apps/web/src/pages/Dashboard.tsx=1, apps/web/src/pages/Overview/Overview.tsx=1, apps/web/src/pages/Admin/FamilySettings.tsx=1, apps/web/src/pages/Periods/PeriodDetail.tsx=1 |
| `gray-100` | text:84, bg:14, border:6 | apps/web/src/pages/Admin/FamilySettings.tsx=17, apps/web/src/pages/Invoices/InvoiceDetail.tsx=10, apps/web/src/pages/Periods/PeriodList.tsx=10, apps/web/src/pages/Admin/Users.tsx=9, apps/web/src/components/Common/SpendBreakdownCard.tsx=6, apps/web/src/pages/Invoices/AddInvoice.tsx=6, apps/web/src/pages/Expenses/AddExpense.tsx=6, apps/web/src/pages/Overview/Overview.tsx=5 |
| `gray-200` | border:74, text:9, bg:4 | apps/web/src/pages/Periods/PeriodList.tsx=11, apps/web/src/pages/Admin/Users.tsx=10, apps/web/src/pages/Admin/FamilySettings.tsx=9, apps/web/src/pages/Invoices/InvoiceDetail.tsx=8, apps/web/src/pages/Overview/Overview.tsx=6, apps/web/src/pages/Settings/Profile.tsx=6, apps/web/src/components/Layout/AppLayout.tsx=5, apps/web/src/pages/Invoices/AddInvoice.tsx=5 |
| `gray-300` | text:53, border:48 | apps/web/src/pages/Admin/FamilySettings.tsx=18, apps/web/src/pages/Periods/PeriodList.tsx=18, apps/web/src/pages/Admin/Users.tsx=12, apps/web/src/pages/Settings/Profile.tsx=11, apps/web/src/pages/Login.tsx=9, apps/web/src/pages/Expenses/AddExpense.tsx=8, apps/web/src/components/Invoice/AllocationExplanation.tsx=6, apps/web/src/pages/Invoices/AddInvoice.tsx=5 |
| `gray-400` | text:99, border:4, bg:2 | apps/web/src/pages/Admin/FamilySettings.tsx=16, apps/web/src/pages/Periods/PeriodList.tsx=12, apps/web/src/pages/Admin/Users.tsx=10, apps/web/src/pages/Settings/Profile.tsx=9, apps/web/src/pages/Expenses/AddExpense.tsx=8, apps/web/src/pages/Invoices/AddInvoice.tsx=7, apps/web/src/pages/Invoices/InvoiceDetail.tsx=6, apps/web/src/components/Invoice/AllocationExplanation.tsx=5 |
| `gray-50` | bg:31 | apps/web/src/pages/Admin/FamilySettings.tsx=6, apps/web/src/pages/Invoices/AddInvoice.tsx=5, apps/web/src/pages/Periods/PeriodList.tsx=4, apps/web/src/pages/Settings/Profile.tsx=3, apps/web/src/pages/Admin/Users.tsx=3, apps/web/src/pages/Expenses/AddExpense.tsx=3, apps/web/src/components/Distribution/DistributionUserRow.tsx=1, apps/web/src/components/Common/AppErrorBoundary.tsx=1 |
| `gray-500` | text:97, border:5, bg:1 | apps/web/src/pages/Admin/FamilySettings.tsx=19, apps/web/src/pages/Settings/Profile.tsx=12, apps/web/src/pages/Periods/PeriodList.tsx=11, apps/web/src/pages/Admin/Users.tsx=8, apps/web/src/pages/Invoices/InvoiceDetail.tsx=6, apps/web/src/pages/Expenses/AddExpense.tsx=6, apps/web/src/components/Invoice/AllocationExplanation.tsx=5, apps/web/src/pages/Periods/PeriodDetail.tsx=5 |
| `gray-700` | border:61, text:46, bg:9 | apps/web/src/pages/Admin/FamilySettings.tsx=19, apps/web/src/pages/Settings/Profile.tsx=14, apps/web/src/pages/Periods/PeriodList.tsx=13, apps/web/src/pages/Admin/Users.tsx=10, apps/web/src/pages/Invoices/AddInvoice.tsx=10, apps/web/src/pages/Expenses/AddExpense.tsx=10, apps/web/src/components/Invoice/AllocationExplanation.tsx=9, apps/web/src/pages/Login.tsx=8 |
| `gray-800` | bg:65, border:59, text:3 | apps/web/src/pages/Admin/FamilySettings.tsx=18, apps/web/src/pages/Periods/PeriodList.tsx=18, apps/web/src/pages/Admin/Users.tsx=17, apps/web/src/pages/Invoices/InvoiceDetail.tsx=10, apps/web/src/pages/Invoices/InvoiceList.tsx=8, apps/web/src/pages/Overview/Overview.tsx=7, apps/web/src/pages/Invoices/AddInvoice.tsx=7, apps/web/src/components/Layout/AppLayout.tsx=6 |
| `gray-800/50` | bg:2 | apps/web/src/pages/Periods/PeriodList.tsx=1, apps/web/src/pages/Expenses/AddExpense.tsx=1 |
| `gray-900` | text:84, bg:44 | apps/web/src/pages/Admin/FamilySettings.tsx=21, apps/web/src/pages/Periods/PeriodList.tsx=15, apps/web/src/pages/Admin/Users.tsx=14, apps/web/src/pages/Invoices/InvoiceDetail.tsx=11, apps/web/src/pages/Invoices/InvoiceList.tsx=11, apps/web/src/pages/Overview/Overview.tsx=9, apps/web/src/pages/Invoices/AddInvoice.tsx=7, apps/web/src/pages/Periods/PeriodDetail.tsx=6 |
| `gray-950` | bg:4 | apps/web/src/components/Common/AppErrorBoundary.tsx=1, apps/web/src/components/Layout/AppLayout.tsx=1, apps/web/src/routes/index.tsx=1, apps/web/src/pages/Login.tsx=1 |
| `green-100` | bg:7 | apps/web/src/pages/Overview/Overview.tsx=2, apps/web/src/components/Common/TagPill.tsx=1, apps/web/src/pages/Dashboard.tsx=1, apps/web/src/pages/Admin/Users.tsx=1, apps/web/src/pages/Periods/PeriodDetail.tsx=1, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1 |
| `green-200` | border:9, bg:2 | apps/web/src/pages/Settings/Profile.tsx=3, apps/web/src/pages/Overview/Overview.tsx=2, apps/web/src/pages/Admin/FamilySettings.tsx=2, apps/web/src/pages/Admin/Users.tsx=1, apps/web/src/pages/Invoices/InvoiceList.tsx=1, apps/web/src/pages/Periods/PeriodDetail.tsx=1, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1 |
| `green-300` | text:3 | apps/web/src/components/Common/TagPill.tsx=1, apps/web/src/pages/Overview/Overview.tsx=1, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1 |
| `green-400` | text:15 | apps/web/src/pages/Settings/Profile.tsx=3, apps/web/src/pages/Overview/Overview.tsx=2, apps/web/src/pages/Admin/FamilySettings.tsx=2, apps/web/src/pages/Periods/PeriodDetail.tsx=2, apps/web/src/pages/Dashboard.tsx=1, apps/web/src/pages/Admin/Users.tsx=1, apps/web/src/pages/Invoices/AddInvoice.tsx=1, apps/web/src/pages/Invoices/InvoiceDetail.tsx=1 |
| `green-400/80` | text:3 | apps/web/src/pages/Overview/Overview.tsx=1, apps/web/src/pages/Invoices/InvoiceList.tsx=1, apps/web/src/pages/Periods/PeriodDetail.tsx=1 |
| `green-50` | bg:6 | apps/web/src/pages/Settings/Profile.tsx=3, apps/web/src/pages/Admin/FamilySettings.tsx=2, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1 |
| `green-500` | text:7, bg:5 | apps/web/src/pages/Overview/Overview.tsx=3, apps/web/src/pages/Invoices/InvoiceDetail.tsx=2, apps/web/src/pages/Periods/PeriodDetail.tsx=2, apps/web/src/pages/Dashboard.tsx=1, apps/web/src/pages/Settings/Profile.tsx=1, apps/web/src/pages/Admin/Users.tsx=1, apps/web/src/pages/Invoices/AddInvoice.tsx=1, apps/web/src/pages/Invoices/InvoiceList.tsx=1 |
| `green-700` | text:13, bg:2 | apps/web/src/pages/Settings/Profile.tsx=4, apps/web/src/pages/Overview/Overview.tsx=2, apps/web/src/pages/Admin/FamilySettings.tsx=2, apps/web/src/pages/Periods/PeriodDetail.tsx=2, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=2, apps/web/src/components/Common/TagPill.tsx=1, apps/web/src/pages/Invoices/InvoiceDetail.tsx=1, apps/web/src/pages/Invoices/InvoiceList.tsx=1 |
| `green-800` | border:6, text:1 | apps/web/src/pages/Settings/Profile.tsx=3, apps/web/src/pages/Admin/FamilySettings.tsx=2, apps/web/src/pages/Dashboard.tsx=1, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1 |
| `green-900/20` | bg:6 | apps/web/src/pages/Settings/Profile.tsx=3, apps/web/src/pages/Admin/FamilySettings.tsx=2, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1 |
| `green-900/30` | bg:7 | apps/web/src/pages/Overview/Overview.tsx=2, apps/web/src/components/Common/TagPill.tsx=1, apps/web/src/pages/Dashboard.tsx=1, apps/web/src/pages/Admin/Users.tsx=1, apps/web/src/pages/Periods/PeriodDetail.tsx=1, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1 |
| `green-900/50` | border:3, bg:2 | apps/web/src/pages/Overview/Overview.tsx=2, apps/web/src/pages/Admin/Users.tsx=1, apps/web/src/pages/Invoices/InvoiceList.tsx=1, apps/web/src/pages/Periods/PeriodDetail.tsx=1 |
| `indigo-100` | bg:7 | apps/web/src/pages/Admin/Users.tsx=2, apps/web/src/pages/Admin/FamilySettings.tsx=2, apps/web/src/components/Distribution/DistributionUserRow.tsx=1, apps/web/src/pages/Overview/Overview.tsx=1, apps/web/src/pages/Invoices/InvoiceDetail.tsx=1 |
| `indigo-200` | bg:3, text:1, border:1 | apps/web/src/components/Layout/AppLayout.tsx=1, apps/web/src/pages/Login.tsx=1, apps/web/src/pages/Overview/Overview.tsx=1, apps/web/src/pages/Admin/Users.tsx=1, apps/web/src/pages/Invoices/InvoiceDetail.tsx=1 |
| `indigo-200/80` | bg:1 | apps/web/src/components/Layout/AppLayout.tsx=1 |
| `indigo-300` | text:12, border:9 | apps/web/src/pages/Settings/Profile.tsx=4, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=4, apps/web/src/pages/Admin/FamilySettings.tsx=3, apps/web/src/components/Distribution/DistributionUserRow.tsx=2, apps/web/src/pages/Invoices/AddInvoice.tsx=2, apps/web/src/components/Common/TagPill.tsx=1, apps/web/src/components/Common/TileGrid.tsx=1, apps/web/src/components/Layout/AppLayout.tsx=1 |
| `indigo-400` | text:35, border:1 | apps/web/src/pages/Settings/Profile.tsx=7, apps/web/src/pages/Expenses/AddExpense.tsx=5, apps/web/src/pages/Admin/FamilySettings.tsx=4, apps/web/src/components/Invoice/UserSharesGrid.tsx=3, apps/web/src/pages/Overview/Overview.tsx=3, apps/web/src/pages/Admin/Users.tsx=3, apps/web/src/pages/Invoices/AddInvoice.tsx=3, apps/web/src/components/Layout/AppLayout.tsx=2 |
| `indigo-50` | bg:12 | apps/web/src/pages/Settings/Profile.tsx=3, apps/web/src/pages/Invoices/AddInvoice.tsx=2, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=2, apps/web/src/components/Distribution/DistributionUserRow.tsx=1, apps/web/src/components/Common/TagPill.tsx=1, apps/web/src/components/Layout/AppLayout.tsx=1, apps/web/src/pages/Overview/Overview.tsx=1, apps/web/src/pages/Admin/FamilySettings.tsx=1 |
| `indigo-50/60` | bg:1 | apps/web/src/pages/Login.tsx=1 |
| `indigo-500` | text:38, bg:37, ring:35, border:21 | apps/web/src/pages/Admin/FamilySettings.tsx=26, apps/web/src/pages/Settings/Profile.tsx=15, apps/web/src/pages/Invoices/AddInvoice.tsx=13, apps/web/src/pages/Admin/Users.tsx=12, apps/web/src/pages/Overview/Overview.tsx=8, apps/web/src/pages/Invoices/InvoiceList.tsx=7, apps/web/src/pages/Expenses/AddExpense.tsx=7, apps/web/src/components/Layout/AppLayout.tsx=6 |
| `indigo-500/25` | bg:1 | apps/web/src/components/Layout/AppLayout.tsx=1 |
| `indigo-700` | bg:19, text:13, border:8 | apps/web/src/pages/Admin/FamilySettings.tsx=8, apps/web/src/pages/Settings/Profile.tsx=7, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=5, apps/web/src/pages/Admin/Users.tsx=4, apps/web/src/pages/Invoices/AddInvoice.tsx=3, apps/web/src/components/Distribution/DistributionUserRow.tsx=2, apps/web/src/components/Layout/AppLayout.tsx=2, apps/web/src/pages/Overview/Overview.tsx=2 |
| `indigo-800` | border:1 | apps/web/src/pages/Login.tsx=1 |
| `indigo-900/10` | bg:1 | apps/web/src/pages/Login.tsx=1 |
| `indigo-900/20` | bg:5 | apps/web/src/pages/Invoices/AddInvoice.tsx=2, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=2, apps/web/src/components/Distribution/DistributionUserRow.tsx=1 |
| `indigo-900/30` | bg:11 | apps/web/src/pages/Settings/Profile.tsx=3, apps/web/src/pages/Overview/Overview.tsx=2, apps/web/src/pages/Admin/Users.tsx=2, apps/web/src/components/Distribution/DistributionUserRow.tsx=1, apps/web/src/components/Common/TagPill.tsx=1, apps/web/src/pages/Admin/FamilySettings.tsx=1, apps/web/src/pages/Invoices/InvoiceDetail.tsx=1 |
| `indigo-900/40` | bg:3 | apps/web/src/pages/Admin/FamilySettings.tsx=2, apps/web/src/components/Layout/AppLayout.tsx=1 |
| `indigo-900/50` | bg:3 | apps/web/src/pages/Overview/Overview.tsx=1, apps/web/src/pages/Admin/Users.tsx=1, apps/web/src/pages/Invoices/InvoiceDetail.tsx=1 |
| `offset-gray-950` | ring:1 | apps/web/src/components/Common/ActionIconBar.tsx=1 |
| `orange-400` | text:1 | apps/web/src/pages/Invoices/AddInvoice.tsx=1 |
| `orange-500` | text:1 | apps/web/src/pages/Invoices/AddInvoice.tsx=1 |
| `red-100` | bg:6 | apps/web/src/pages/Overview/Overview.tsx=2, apps/web/src/components/Common/TagPill.tsx=1, apps/web/src/pages/Settings/Profile.tsx=1, apps/web/src/pages/Admin/Users.tsx=1, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1 |
| `red-200` | border:20, bg:2 | apps/web/src/pages/Settings/Profile.tsx=7, apps/web/src/pages/Admin/Users.tsx=3, apps/web/src/pages/Overview/Overview.tsx=2, apps/web/src/pages/Admin/FamilySettings.tsx=2, apps/web/src/pages/Periods/PeriodList.tsx=2, apps/web/src/pages/Login.tsx=1, apps/web/src/pages/Invoices/AddInvoice.tsx=1, apps/web/src/pages/Invoices/InvoiceList.tsx=1 |
| `red-300` | text:5 | apps/web/src/pages/Admin/FamilySettings.tsx=2, apps/web/src/components/Common/TagPill.tsx=1, apps/web/src/pages/Overview/Overview.tsx=1, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1 |
| `red-400` | text:36 | apps/web/src/pages/Settings/Profile.tsx=8, apps/web/src/pages/Admin/FamilySettings.tsx=7, apps/web/src/pages/Admin/Users.tsx=5, apps/web/src/pages/Periods/PeriodList.tsx=5, apps/web/src/pages/Overview/Overview.tsx=2, apps/web/src/pages/Expenses/AddExpense.tsx=2, apps/web/src/components/Layout/AppLayout.tsx=1, apps/web/src/pages/Login.tsx=1 |
| `red-400/80` | text:3 | apps/web/src/pages/Overview/Overview.tsx=1, apps/web/src/pages/Invoices/InvoiceList.tsx=1, apps/web/src/pages/Periods/PeriodDetail.tsx=1 |
| `red-50` | bg:19 | apps/web/src/pages/Settings/Profile.tsx=6, apps/web/src/pages/Admin/Users.tsx=3, apps/web/src/pages/Periods/PeriodList.tsx=3, apps/web/src/pages/Admin/FamilySettings.tsx=2, apps/web/src/components/Layout/AppLayout.tsx=1, apps/web/src/pages/Login.tsx=1, apps/web/src/pages/Invoices/AddInvoice.tsx=1, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1 |
| `red-500` | text:19, bg:6, border:1 | apps/web/src/pages/Settings/Profile.tsx=5, apps/web/src/pages/Admin/FamilySettings.tsx=5, apps/web/src/pages/Overview/Overview.tsx=3, apps/web/src/pages/Admin/Users.tsx=3, apps/web/src/pages/Invoices/InvoiceDetail.tsx=2, apps/web/src/pages/Periods/PeriodDetail.tsx=2, apps/web/src/pages/Periods/PeriodList.tsx=2, apps/web/src/components/Layout/AppLayout.tsx=1 |
| `red-700` | text:26, bg:3 | apps/web/src/pages/Settings/Profile.tsx=8, apps/web/src/pages/Periods/PeriodList.tsx=5, apps/web/src/pages/Admin/FamilySettings.tsx=4, apps/web/src/pages/Overview/Overview.tsx=2, apps/web/src/pages/Admin/Users.tsx=2, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=2, apps/web/src/components/Common/TagPill.tsx=1, apps/web/src/pages/Login.tsx=1 |
| `red-800` | border:15 | apps/web/src/pages/Settings/Profile.tsx=5, apps/web/src/pages/Admin/Users.tsx=2, apps/web/src/pages/Admin/FamilySettings.tsx=2, apps/web/src/pages/Periods/PeriodList.tsx=2, apps/web/src/pages/Login.tsx=1, apps/web/src/pages/Invoices/AddInvoice.tsx=1, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1, apps/web/src/pages/Expenses/AddExpense.tsx=1 |
| `red-900` | border:2 | apps/web/src/pages/Settings/Profile.tsx=2 |
| `red-900/20` | bg:19 | apps/web/src/pages/Settings/Profile.tsx=6, apps/web/src/pages/Admin/Users.tsx=3, apps/web/src/pages/Periods/PeriodList.tsx=3, apps/web/src/pages/Admin/FamilySettings.tsx=2, apps/web/src/components/Layout/AppLayout.tsx=1, apps/web/src/pages/Login.tsx=1, apps/web/src/pages/Invoices/AddInvoice.tsx=1, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1 |
| `red-900/30` | bg:5 | apps/web/src/pages/Overview/Overview.tsx=2, apps/web/src/components/Common/TagPill.tsx=1, apps/web/src/pages/Admin/Users.tsx=1, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1 |
| `red-900/40` | bg:1 | apps/web/src/pages/Settings/Profile.tsx=1 |
| `red-900/50` | border:3, bg:2 | apps/web/src/pages/Overview/Overview.tsx=2, apps/web/src/pages/Admin/Users.tsx=1, apps/web/src/pages/Invoices/InvoiceList.tsx=1, apps/web/src/pages/Periods/PeriodDetail.tsx=1 |
| `sky-300` | text:2 | apps/web/src/components/Common/TagPill.tsx=1, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1 |
| `sky-50` | bg:2 | apps/web/src/components/Common/TagPill.tsx=1, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1 |
| `sky-500` | bg:3 | apps/web/src/pages/Dashboard.tsx=1, apps/web/src/pages/Overview/Overview.tsx=1, apps/web/src/pages/Periods/PeriodDetail.tsx=1 |
| `sky-700` | text:2 | apps/web/src/components/Common/TagPill.tsx=1, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1 |
| `sky-900/30` | bg:2 | apps/web/src/components/Common/TagPill.tsx=1, apps/web/src/pages/Subscriptions/SubscriptionList.tsx=1 |
| `slate-100` | text:1 | apps/web/src/components/Layout/AppLayout.tsx=1 |
| `slate-100/80` | bg:1 | apps/web/src/components/Layout/AppLayout.tsx=1 |
| `slate-300` | text:2, border:1 | apps/web/src/pages/Periods/PeriodList.tsx=2, apps/web/src/components/Layout/AppLayout.tsx=1 |
| `slate-300/70` | text:1 | apps/web/src/components/Layout/AppLayout.tsx=1 |
| `slate-400/15` | bg:2 | apps/web/src/pages/Periods/PeriodList.tsx=2 |
| `slate-400/25` | bg:1 | apps/web/src/pages/Periods/PeriodList.tsx=1 |
| `slate-500` | text:1 | apps/web/src/components/Layout/AppLayout.tsx=1 |
| `slate-700` | text:1 | apps/web/src/components/Layout/AppLayout.tsx=1 |
| `violet-100` | bg:2 | apps/web/src/pages/Invoices/InvoiceDetail.tsx=1, apps/web/src/pages/Invoices/InvoiceList.tsx=1 |
| `violet-300` | text:2 | apps/web/src/pages/Invoices/InvoiceDetail.tsx=1, apps/web/src/pages/Invoices/InvoiceList.tsx=1 |
| `violet-700` | text:2 | apps/web/src/pages/Invoices/InvoiceDetail.tsx=1, apps/web/src/pages/Invoices/InvoiceList.tsx=1 |
| `violet-900/30` | bg:2 | apps/web/src/pages/Invoices/InvoiceDetail.tsx=1, apps/web/src/pages/Invoices/InvoiceList.tsx=1 |

## Non-token / Raw colors

Includes hex/rgb/hsl usages, and color-like theme variable definitions found in css/config.

| Raw representation | Top locations (file=count) |
|---|---|
| `#0B1020` | apps/web/vite.config.ts=2, apps/web/index.html=1 |
| `#0b1020` | apps/web/index.html=1 |
| `#2a335c` | apps/web/index.html=1, apps/web/src/main.tsx=1 |
| `#7ee787` | apps/web/src/main.tsx=1 |
| `#9ef` | apps/web/index.html=1 |
| `#fff` | apps/web/index.html=1 |
| `rgb(var(--color-bg)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-border)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-danger)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-danger-soft)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-disabled)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-focus)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-info)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-info-soft)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-neutral)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-primary)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-primary-hover)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-primary-pressed)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-secondary)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-secondary-hover)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-success)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-success-soft)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-surface)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-surface-elevated)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-text-primary)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-text-secondary)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-warning)` | apps/web/tailwind.config.js=1 |
| `rgb(var(--color-warning-soft)` | apps/web/tailwind.config.js=1 |
| `rgba(11,16,32,.9)` | apps/web/index.html=1 |
| `rgba(11,16,32,.92)` | apps/web/src/main.tsx=1 |
| `var-def:100 116 139` | apps/web/src/index.css=1 |
| `var-def:148 163 184` | apps/web/src/index.css=1 |
| `var-def:15 23 42` | apps/web/src/index.css=1 |
| `var-def:156 163 175` | apps/web/src/index.css=1 |
| `var-def:17 24 39` | apps/web/src/index.css=2 |
| `var-def:217 119 6` | apps/web/src/index.css=4 |
| `var-def:22 163 74` | apps/web/src/index.css=4 |
| `var-def:220 38 38` | apps/web/src/index.css=4 |
| `var-def:229 231 235` | apps/web/src/index.css=1 |
| `var-def:241 245 249` | apps/web/src/index.css=1 |
| `var-def:248 250 252` | apps/web/src/index.css=1 |
| `var-def:249 250 251` | apps/web/src/index.css=1 |
| `var-def:255 255 255` | apps/web/src/index.css=1 |
| `var-def:3 7 25` | apps/web/src/index.css=1 |
| `var-def:30 41 59` | apps/web/src/index.css=1 |
| `var-def:71 85 105` | apps/web/src/index.css=2 |
| `var-def:75 85 99` | apps/web/src/index.css=1 |
| `var-def:79 70 229` | apps/web/src/index.css=16 |

## Mechanical replacement summary (`*-600 -> *-500`)

Only these Tailwind utility groups were changed: `text`, `bg`, `border`, `ring`, `outline`, `fill`, `stroke` (including prefixed variants like `hover:` / `dark:`).

| Color family | Replacements |
|---|---:|
| indigo | 88 |
| gray | 32 |
| red | 15 |
| amber | 8 |
| green | 6 |
| emerald | 1 |
| orange | 1 |

| File type | Replacements |
|---|---:|
| `.tsx` | 151 |

Total replacements: **151** across **22** files.

## Candidate semantic tokens (proposal only)

- `primary`: most frequent brand/action color family (likely indigo-based utilities).
- `success`: positive states/actions (green family).
- `danger`: destructive/error states/actions (red family).
- `warning`: caution/intermediate states (amber family).
- `neutral`: secondary controls and subdued status text (slate/gray families).
- `surface`: cards/dialog/background layers (surface/bg classes and vars).
- `background`: app/page background color levels.
- `border`: separators and control outlines.
- `text`: primary/secondary/disabled foreground roles.

