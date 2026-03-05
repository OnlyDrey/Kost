import { calcPaymentStatus, calcRemaining } from "./paymentMath";

export type InvoiceStatus = "PAID" | "PARTIALLY_PAID" | "OVERDUE" | "UNPAID";

export function getInvoiceStatus(params: {
  totalCents: number;
  totalPaidCents: number;
  dueDate?: string | Date | null;
}): InvoiceStatus {
  const remaining = calcRemaining(params.totalCents, params.totalPaidCents);
  const paymentStatus = calcPaymentStatus(
    params.totalCents,
    params.totalPaidCents,
  );

  if (paymentStatus === "PAID") {
    return "PAID";
  }

  if (paymentStatus === "PARTIALLY_PAID") {
    return "PARTIALLY_PAID";
  }

  const dueAt = params.dueDate ? new Date(params.dueDate) : null;
  if (remaining > 0 && dueAt && dueAt < new Date()) {
    return "OVERDUE";
  }

  return "UNPAID";
}
