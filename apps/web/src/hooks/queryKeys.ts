/**
 * Centralised TanStack Query key factory.
 * Import from here rather than using raw string arrays so that all
 * invalidations stay in sync automatically.
 */
export const queryKeys = {
  invoices: (periodId?: string) => ['invoices', periodId] as const,
  invoice: (id: string) => ['invoice', id] as const,
  periods: () => ['periods'] as const,
  period: (id: string) => ['period', id] as const,
  currentPeriod: () => ['currentPeriod'] as const,
  periodStats: (id: string) => ['periodStats', id] as const,
  userIncomes: (periodId: string) => ['userIncomes', periodId] as const,
  users: () => ['users'] as const,
  user: (id: string) => ['user', id] as const,
  categories: () => ['categories'] as const,
  paymentMethods: () => ['paymentMethods'] as const,
  currency: () => ['currency'] as const,
  currencySymbolPosition: () => ['currencySymbolPosition'] as const,
  vendors: () => ['vendors'] as const,
  subscriptions: () => ['subscriptions'] as const,
  subscription: (id: string) => ['subscription', id] as const,
};
