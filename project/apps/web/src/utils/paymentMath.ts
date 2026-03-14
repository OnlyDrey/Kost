export type PaymentLike = { amountCents: number };

export type PaymentStatus = "PAID" | "PARTIALLY_PAID" | "UNPAID";

export function calcPaidSum(payments?: PaymentLike[] | null): number {
  return (payments ?? []).reduce(
    (sum, payment) => sum + payment.amountCents,
    0,
  );
}

export function calcRemaining(
  totalCents: number,
  paidSumCents: number,
): number {
  return Math.max(0, totalCents - paidSumCents);
}

export function calcPaymentStatus(
  totalCents: number,
  paidSumCents: number,
): PaymentStatus {
  if (paidSumCents <= 0) return "UNPAID";
  if (paidSumCents >= totalCents) return "PAID";
  return "PARTIALLY_PAID";
}
