export function isPeriodClosed(period: { status: "OPEN" | "CLOSED"; closedAt?: string | null }) {
  return period.status === "CLOSED" || Boolean(period.closedAt);
}
