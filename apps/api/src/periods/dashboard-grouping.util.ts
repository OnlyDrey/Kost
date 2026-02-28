export type InvoiceLike = { totalCents: number; payments?: Array<{ amountCents: number }> };

export function groupInvoiceSums(invoices: InvoiceLike[]) {
  return invoices.reduce(
    (acc, invoice) => {
      const paid = (invoice.payments ?? []).reduce((sum, p) => sum + p.amountCents, 0);
      const remaining = Math.max(0, invoice.totalCents - paid);

      if (remaining === invoice.totalCents) {
        acc.unpaid += invoice.totalCents;
      } else if (remaining > 0) {
        acc.partial += remaining;
      } else {
        acc.paid += paid;
      }

      return acc;
    },
    { unpaid: 0, partial: 0, paid: 0 },
  );
}

export function normalizeDashboardFilter(filter: string | null | undefined) {
  if (filter === "paid" || filter === "remaining" || filter === "all") return filter;
  return "all";
}

export function defaultSelectedUserIdsForNewExpense() {
  return [] as string[];
}
