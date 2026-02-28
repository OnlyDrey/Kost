import type { Period } from "../services/api";

export function isPeriodClosed(period: Pick<Period, "status" | "closedAt">) {
  return period.status === "CLOSED" || Boolean(period.closedAt);
}
