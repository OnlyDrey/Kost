import {
  calcPaidSum,
  calcPaymentStatus,
  calcRemaining,
} from "../invoices/payment-status.util";

export type InvoiceLike = {
  totalCents: number;
  payments?: Array<{ amountCents: number }>;
};

export function groupInvoiceSums(invoices: InvoiceLike[]) {
  return invoices.reduce(
    (acc, invoice) => {
      const paid = calcPaidSum(invoice.payments);
      const remaining = calcRemaining(invoice.totalCents, paid);
      const paymentStatus = calcPaymentStatus(invoice.totalCents, paid);

      if (paymentStatus === "UNPAID") {
        acc.unpaid += invoice.totalCents;
      } else if (paymentStatus === "PARTIALLY_PAID") {
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
  if (filter === "paid" || filter === "remaining" || filter === "all")
    return filter;
  return "all";
}

export function defaultSelectedUserIdsForNewExpense() {
  return [] as string[];
}
