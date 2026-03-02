export type InvoiceStatus = "PAID" | "PARTIALLY_PAID" | "OVERDUE" | "UNPAID";

export function getInvoiceStatus(params: {
  totalCents: number;
  totalPaidCents: number;
  dueDate?: string | Date | null;
}): InvoiceStatus {
  const remaining = Math.max(0, params.totalCents - params.totalPaidCents);

  if (remaining === 0 && params.totalPaidCents > 0) {
    return "PAID";
  }

  if (params.totalPaidCents > 0 && remaining > 0) {
    return "PARTIALLY_PAID";
  }

  const dueAt = params.dueDate ? new Date(params.dueDate) : null;
  if (remaining > 0 && dueAt && dueAt < new Date()) {
    return "OVERDUE";
  }

  return "UNPAID";
}
