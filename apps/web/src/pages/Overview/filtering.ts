export const OVERVIEW_STATUS_VALUES = [
  "all",
  "paid",
  "remaining",
  "unpaid",
  "partial",
  "overdue",
] as const;

export type OverviewStatus = (typeof OVERVIEW_STATUS_VALUES)[number];
export type OverviewFilter = "all" | "share-user";

const STATUS_SET = new Set<string>(OVERVIEW_STATUS_VALUES);

export function normalizeOverviewQuery(
  raw: URLSearchParams,
  validUserIds?: Set<string>,
) {
  const params = new URLSearchParams(raw);
  const rawStatus = params.get("status");
  const rawFilter = params.get("filter");
  const rawShareUser = params.get("shareUser") || "";

  let status: OverviewStatus = STATUS_SET.has(rawStatus || "")
    ? (rawStatus as OverviewStatus)
    : "all";

  // Backward compatibility: old URLs used filter=remaining|paid... as status.
  if ((!rawStatus || !STATUS_SET.has(rawStatus)) && STATUS_SET.has(rawFilter || "")) {
    status = rawFilter as OverviewStatus;
    params.set("status", status);
    params.delete("filter");
  }

  let filter: OverviewFilter = rawFilter === "share-user" ? "share-user" : "all";
  if (filter === "all") params.delete("filter");

  let shareUserId = rawShareUser;
  const isValidShareUser =
    !validUserIds || !shareUserId || validUserIds.has(shareUserId);

  if (filter !== "share-user" || !shareUserId || !isValidShareUser) {
    filter = "all";
    shareUserId = "";
    params.delete("shareUser");
    if (rawFilter !== "share-user") params.delete("filter");
    if (rawFilter === "share-user") params.delete("filter");
  }

  if (status === "all") params.delete("status");
  else params.set("status", status);

  if (filter === "share-user") params.set("filter", "share-user");

  return { params, status, filter, shareUserId };
}
