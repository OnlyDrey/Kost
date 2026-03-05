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

interface ShareUserResolver {
  isValidUserId: (value: string) => boolean;
  usernameToId: (username: string) => string | undefined;
  idToUsername: (id: string) => string | undefined;
}

export function normalizeOverviewQuery(
  raw: URLSearchParams,
  resolver?: ShareUserResolver,
) {
  const params = new URLSearchParams(raw);
  const rawStatus = params.get("status");
  const rawFilter = params.get("filter");
  const rawShareUser = (params.get("shareUser") || "").trim();

  let status: OverviewStatus = STATUS_SET.has(rawStatus || "")
    ? (rawStatus as OverviewStatus)
    : "all";

  if (
    (!rawStatus || !STATUS_SET.has(rawStatus)) &&
    STATUS_SET.has(rawFilter || "")
  ) {
    status = rawFilter as OverviewStatus;
    params.set("status", status);
    params.delete("filter");
  }

  let filter: OverviewFilter =
    rawFilter === "share-user" ? "share-user" : "all";
  if (filter === "all") params.delete("filter");

  let shareUserId = "";
  let shareUserUsername = "";

  if (rawShareUser && resolver) {
    if (resolver.isValidUserId(rawShareUser)) {
      shareUserId = rawShareUser;
      shareUserUsername = resolver.idToUsername(rawShareUser) ?? "";
    } else {
      const resolvedId = resolver.usernameToId(rawShareUser);
      if (resolvedId) {
        shareUserId = resolvedId;
        shareUserUsername = rawShareUser;
      }
    }
  }

  if (!resolver) {
    shareUserId = rawShareUser;
  }

  const isValidShareUser = !resolver || !rawShareUser || Boolean(shareUserId);

  if (filter !== "share-user" || !rawShareUser || !isValidShareUser) {
    filter = "all";
    shareUserId = "";
    shareUserUsername = "";
    params.delete("shareUser");
    params.delete("filter");
  } else {
    params.set("filter", "share-user");
    params.set("shareUser", shareUserUsername || rawShareUser);
  }

  if (status === "all") params.delete("status");
  else params.set("status", status);

  return { params, status, filter, shareUserId, shareUserUsername };
}
