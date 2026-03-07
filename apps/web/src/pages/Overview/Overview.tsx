import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Receipt,
  DollarSign,
  TrendingUp,
  CircleCheckBig,
  CircleAlert,
  Users,
  Pencil,
  Trash2,
  Plus,
  Eraser,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  usePeriods,
  usePeriod,
  usePeriodStats,
  useInvoices,
  useCurrency,
  useVendors,
  useDeleteInvoice,
  useAddPayment,
  useCurrencyFormatter,
  useUsers,
} from "../../hooks/useApi";
import { useAuth } from "../../stores/auth.context";
import { useSettings } from "../../stores/settings.context";
import { formatDate } from "../../utils/date";
import TileGrid from "../../components/Common/TileGrid";
import SpendBreakdownCard from "../../components/Common/SpendBreakdownCard";
import UserSharesGrid from "../../components/Invoice/UserSharesGrid";
import ExpenseItemCard from "../../components/Expense/ExpenseItemCard";
import { distributionLabel } from "../../utils/distribution";
import ActionIconBar from "../../components/Common/ActionIconBar";
import { normalizeOverviewQuery, type OverviewStatus } from "./filtering";
import {
  SELECT_TRIGGER,
  FOCUS_RING,
} from "../../components/Common/focusStyles";
import { useConfirmDialog } from "../../components/Common/ConfirmDialogProvider";
import AppSelect from "../../components/Common/AppSelect";
import PeriodStatusBadge from "../../components/Common/PeriodStatusBadge";
import { getApiErrorMessage } from "../../utils/apiErrors";
import { getInvoiceStatus } from "../../utils/invoiceStatus";
import { Button } from "../../components/ui/button";
import { getVendorLogoUrl } from "../../utils/vendorLogo";
import { IconButton } from "../../components/ui/icon-button";
import {
  calcPaidSum,
  calcRemaining,
  calcPaymentStatus,
} from "../../utils/paymentMath";

// ------- Period Selector -------

function PeriodSelector({
  periods,
  selectedPeriodId,
  onSelect,
}: {
  periods: { id: string; status?: string; closedAt?: string | null }[];
  selectedPeriodId: string;
  onSelect: (id: string) => void;
}) {
  const sortedPeriods = useMemo(
    () => [...periods].sort((a, b) => b.id.localeCompare(a.id)),
    [periods],
  );

  const inputCls = `h-10 px-3 pr-10 rounded-lg text-sm ${SELECT_TRIGGER}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AppSelect
        value={selectedPeriodId}
        onChange={(e) => onSelect(e.target.value)}
        className={`${inputCls} w-28 min-w-[7rem]`}
        wrapperClassName="w-28 min-w-[7rem]"
      >
        {sortedPeriods.map((p) => (
          <option key={p.id} value={p.id}>
            {p.id}
          </option>
        ))}
      </AppSelect>
    </div>
  );
}

// ------- Main Overview Page -------

export default function Overview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const { settings } = useSettings();

  const { data: periods = [], isLoading: periodsLoading } = usePeriods();

  // Resolve selected period: prefer ?period=... param, else latest month
  const paramPeriodId = searchParams.get("period");
  const resolvedPeriodId = useMemo(() => {
    if (paramPeriodId && periods.find((p) => p.id === paramPeriodId))
      return paramPeriodId;
    if (periods.length > 0)
      return [...periods].sort((a, b) => b.id.localeCompare(a.id))[0].id;
    return "";
  }, [paramPeriodId, periods]);

  const handleSelectPeriod = (id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("period", id);
    params.delete("filter");
    params.delete("shareUser");
    params.delete("status");
    params.delete("category");
    setSearchParams(params, { replace: true });
  };

  const { data: period, isLoading: periodLoading } =
    usePeriod(resolvedPeriodId);
  const { data: stats, isLoading: statsLoading } =
    usePeriodStats(resolvedPeriodId);
  const { data: invoices, isLoading: invoicesLoading } =
    useInvoices(resolvedPeriodId);
  const { data: vendors = [] } = useVendors();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const deleteInvoice = useDeleteInvoice();
  const addPayment = useAddPayment();
  const { data: currency = "NOK" } = useCurrency();
  const fmt = useCurrencyFormatter();
  const { notify } = useConfirmDialog();

  const isLoading =
    periodsLoading || periodLoading || statsLoading || invoicesLoading;

  const userShare = stats?.userShares?.find(
    (s) => s.userId === currentUser?.id,
  );
  const periodFromList = periods.find((p) => p.id === resolvedPeriodId);
  const effectivePeriodStatus =
    period?.status ?? periodFromList?.status ?? "OPEN";
  const closed = effectivePeriodStatus === "CLOSED";

  useEffect(() => {
    if (
      import.meta.env.DEV &&
      period?.status &&
      periodFromList?.status &&
      period.status !== periodFromList.status
    ) {
      console.warn(
        `[Overview] status mismatch for ${resolvedPeriodId}: detail=${period.status}, list=${periodFromList.status}`,
      );
    }
  }, [period?.status, periodFromList?.status, resolvedPeriodId]);

  const userIdSet = useMemo(() => new Set(users.map((u) => u.id)), [users]);
  const usernameMap = useMemo(
    () => new Map(users.map((u) => [u.username.toLowerCase(), u.id])),
    [users],
  );
  const idToUsernameMap = useMemo(
    () => new Map(users.map((u) => [u.id, u.username])),
    [users],
  );

  const normalizedQuery = useMemo(
    () =>
      normalizeOverviewQuery(
        searchParams,
        usersLoading
          ? undefined
          : {
              isValidUserId: (value) => userIdSet.has(value),
              usernameToId: (username) =>
                usernameMap.get(username.toLowerCase()),
              idToUsername: (id) => idToUsernameMap.get(id),
            },
      ),
    [searchParams, usersLoading, userIdSet, usernameMap, idToUsernameMap],
  );

  const filter = normalizedQuery.filter;
  const shareUserId = normalizedQuery.shareUserId;
  const hasShareSelection = filter === "share-user" && !!shareUserId;
  const selectedShareUser = hasShareSelection
    ? stats?.userShares?.find((share) => share.userId === shareUserId)
    : undefined;
  const statusFilter: OverviewStatus = normalizedQuery.status;
  const categoryFilter = searchParams.get("category") || "";

  useEffect(() => {
    if (searchParams.toString() !== normalizedQuery.params.toString()) {
      setSearchParams(normalizedQuery.params, { replace: true });
    }
  }, [normalizedQuery.params, searchParams, setSearchParams]);

  const setFilter = (nextFilter: "all" | "share-user", userId?: string) => {
    const params = new URLSearchParams(searchParams);
    if (nextFilter === "share-user" && userId) {
      const username = idToUsernameMap.get(userId);
      if (usersLoading || username) {
        params.set("filter", "share-user");
        params.set("shareUser", username ?? userId);
      }
    } else {
      params.delete("filter");
      params.delete("shareUser");
    }
    setSearchParams(params, { replace: true });
  };

  const setStatusFilter = (nextStatus: OverviewStatus) => {
    const params = new URLSearchParams(searchParams);
    if (nextStatus === "all") params.delete("status");
    else params.set("status", nextStatus);
    setSearchParams(params, { replace: true });
  };

  const setCategoryFilter = (nextCategory: string) => {
    const params = new URLSearchParams(searchParams);
    if (!nextCategory) params.delete("category");
    else params.set("category", nextCategory);
    setSearchParams(params, { replace: true });
  };

  const paidUnpaid = useMemo(() => {
    const list = invoices ?? [];
    let paidCents = 0;
    let owedCents = 0;
    for (const invoice of list) {
      const totalPaid = calcPaidSum(invoice.payments);
      const remaining = calcRemaining(invoice.totalCents, totalPaid);
      if (remaining === 0) paidCents += invoice.totalCents;
      else owedCents += remaining;
    }
    return { paidCents, owedCents };
  }, [invoices]);

  const statusFilteredInvoices = useMemo(() => {
    const base = invoices ?? [];
    return base.filter((invoice) => {
      const totalPaid = calcPaidSum(invoice.payments);
      const remaining = calcRemaining(invoice.totalCents, totalPaid);
      const dueAt = invoice.dueDate ? new Date(invoice.dueDate) : null;
      const isOverdue = remaining > 0 && !!dueAt && dueAt < new Date();
      const paymentStatus = calcPaymentStatus(invoice.totalCents, totalPaid);
      if (statusFilter === "paid") return paymentStatus === "PAID";
      if (statusFilter === "remaining") return paymentStatus !== "PAID";
      if (statusFilter === "unpaid")
        return paymentStatus === "UNPAID" && !isOverdue;
      if (statusFilter === "partial") return paymentStatus === "PARTIALLY_PAID";
      if (statusFilter === "overdue") return isOverdue;
      return true;
    });
  }, [invoices, statusFilter]);

  const shareFilteredInvoices = useMemo(() => {
    if (!(filter === "share-user" && shareUserId))
      return statusFilteredInvoices;
    return statusFilteredInvoices.filter((invoice) =>
      (invoice.shares ?? []).some((s) => s.userId === shareUserId),
    );
  }, [statusFilteredInvoices, filter, shareUserId]);

  const filteredInvoices = useMemo(() => {
    if (!categoryFilter) return shareFilteredInvoices;
    return shareFilteredInvoices.filter(
      (invoice) => (invoice.category || t("common.other")) === categoryFilter,
    );
  }, [shareFilteredInvoices, categoryFilter, t]);

  const breakdownInvoices = filteredInvoices;
  const listInvoices = filteredInvoices;

  useEffect(() => {
    if (import.meta.env.DEV && listInvoices !== breakdownInvoices) {
      console.warn("[Overview] list and breakdown datasets diverged");
    }
  }, [listInvoices, breakdownInvoices]);

  const now = new Date();
  const grouped = useMemo(
    () =>
      listInvoices.reduce(
        (acc, invoice) => {
          const totalPaid = calcPaidSum(invoice.payments);
          const remaining = calcRemaining(invoice.totalCents, totalPaid);
          const dueAt = invoice.dueDate ? new Date(invoice.dueDate) : null;
          const isOverdue = remaining > 0 && !!dueAt && dueAt < now;
          const paymentStatus = calcPaymentStatus(
            invoice.totalCents,
            totalPaid,
          );
          if (paymentStatus === "PAID")
            acc.paid.push({
              invoice,
              totalPaid,
              remaining,
              displayCents: totalPaid,
            });
          else if (isOverdue)
            acc.overdue.push({
              invoice,
              totalPaid,
              remaining,
              displayCents: remaining,
            });
          else if (paymentStatus === "PARTIALLY_PAID")
            acc.partial.push({
              invoice,
              totalPaid,
              remaining,
              displayCents: remaining,
            });
          else
            acc.unpaid.push({
              invoice,
              totalPaid,
              remaining,
              displayCents: invoice.totalCents,
            });
          return acc;
        },
        {
          overdue: [] as any[],
          unpaid: [] as any[],
          partial: [] as any[],
          paid: [] as any[],
        },
      ),
    [listInvoices, now],
  );

  const visibleGroups = [
    {
      key: "overdue",
      title: t("invoice.statusOverdue"),
      list: grouped.overdue,
      show:
        statusFilter === "all" ||
        statusFilter === "remaining" ||
        statusFilter === "overdue",
      borderClass:
        "border-red-300 dark:border-red-800/70 bg-red-50/30 dark:bg-red-950/20",
      titleClass: "text-red-700 dark:text-red-400",
      amountClass: "text-gray-900 dark:text-gray-100",
    },
    {
      key: "unpaid",
      title: t("invoice.statusUnpaid"),
      list: grouped.unpaid,
      show:
        statusFilter === "all" ||
        statusFilter === "remaining" ||
        statusFilter === "unpaid",
      borderClass: "border-gray-200 dark:border-gray-800",
      titleClass: "text-gray-800 dark:text-gray-200",
      amountClass: "text-gray-900 dark:text-gray-100",
    },
    {
      key: "partial",
      title: t("invoice.statusPartiallyPaid"),
      list: grouped.partial,
      show:
        statusFilter === "all" ||
        statusFilter === "remaining" ||
        statusFilter === "partial",
      borderClass:
        "border-amber-300 dark:border-amber-800/70 bg-amber-50/30 dark:bg-amber-950/20",
      titleClass: "text-amber-700 dark:text-amber-400",
      amountClass: "text-gray-900 dark:text-gray-100",
    },
    {
      key: "paid",
      title: t("invoice.statusPaid"),
      list: grouped.paid,
      show: statusFilter === "all" || statusFilter === "paid",
      borderClass:
        "border-green-300 dark:border-green-800/70 bg-green-50/30 dark:bg-green-950/20",
      titleClass: "text-green-700 dark:text-green-400",
      amountClass: "text-gray-900 dark:text-gray-100",
    },
  ].filter((g) => g.show);

  const getVendorLogo = (vendorName: string) =>
    getVendorLogoUrl(vendors, vendorName);

  if (periodsLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t("overview.title")}
        </h1>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("overview.noPeriods")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t("overview.title")}
          </h1>
        </div>

        {/* Period selector */}
        <div className="flex flex-wrap items-center gap-2 md:justify-start">
          <PeriodSelector
            periods={periods}
            selectedPeriodId={resolvedPeriodId}
            onSelect={handleSelectPeriod}
          />
          {period && (
            <PeriodStatusBadge
              status={closed ? "CLOSED" : "OPEN"}
              variant="field"
            />
          )}
        </div>
      </div>

      {isLoading && resolvedPeriodId ? (
        <div className="flex items-center justify-center min-h-32">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Tiles */}
          <TileGrid
            items={[
              {
                key: "share",
                icon: TrendingUp,
                label: t("dashboard.yourShare"),
                value: fmt(userShare?.totalShareCents ?? 0),
                colorClass: "bg-amber-500",
                onClick: () => setFilter("share-user", currentUser?.id),
              },
              {
                key: "total",
                icon: DollarSign,
                label: t("dashboard.totalAmount"),
                value: fmt(stats?.totalAmountCents ?? 0),
                colorClass: "bg-emerald-500",
                onClick: () => setFilter("all"),
              },
              {
                key: "paid",
                icon: CircleCheckBig,
                label: t("dashboard.paidLabel"),
                value: fmt(paidUnpaid.paidCents),
                colorClass: "bg-green-500",
                onClick: () => setStatusFilter("paid"),
              },
              {
                key: "remaining",
                icon: CircleAlert,
                label: t("dashboard.remainingLabel"),
                value: fmt(paidUnpaid.owedCents),
                colorClass: "bg-red-500",
                onClick: () => setStatusFilter("remaining"),
              },
              {
                key: "invoices",
                icon: Receipt,
                label: t("dashboard.totalInvoices"),
                value: stats?.totalInvoices ?? 0,
                colorClass: "bg-slate-500",
                onClick: () => setFilter("all"),
              },
              {
                key: "users",
                icon: Users,
                label: t("period.userShares"),
                value: stats?.userShares?.length ?? 0,
                colorClass: "bg-violet-500",
                onClick: () => setFilter("share-user", currentUser?.id),
              },
            ]}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div className="space-y-4 md:col-span-1">
              {/* Charts */}
              {((stats?.userShares && stats.userShares.length > 0) ||
                (invoices && invoices.length > 0)) && (
                <>
                  {stats?.userShares && stats.userShares.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {t("period.userShares")}
                        </h2>
                        <IconButton
                          type="button"
                          onClick={() => setFilter("all")}
                          aria-label={t("common.reset")}
                          className={
                            hasShareSelection
                              ? "border-primary/40 text-primary"
                              : ""
                          }
                        >
                          <Eraser size={16} />
                        </IconButton>
                      </div>
                      <UserSharesGrid
                        shares={stats.userShares.map((share) => ({
                          id: share.userId,
                          userId: share.userId,
                          shareCents: share.totalShareCents,
                          user: { name: share.userName },
                        }))}
                        totalCents={stats?.totalAmountCents ?? 0}
                        currency={currency}
                        emptyLabel={t("common.noData")}
                        unknownLabel={t("invoice.unknown")}
                        onSelectShare={(userId) =>
                          setFilter("share-user", userId)
                        }
                        selectedUserId={
                          hasShareSelection ? shareUserId : undefined
                        }
                      />
                    </div>
                  )}

                  {invoices && invoices.length > 0 && (
                    <SpendBreakdownCard
                      invoices={breakdownInvoices}
                      currentUserId={currentUser?.id}
                      selectedShareUserId={
                        hasShareSelection ? shareUserId : undefined
                      }
                      selectedShareUserName={selectedShareUser?.userName}
                      currency={currency}
                      title={t("period.categoryBreakdown")}
                      selectedCategory={categoryFilter || undefined}
                      onSelectCategory={(category) =>
                        setCategoryFilter(category)
                      }
                      onResetCategory={() => setCategoryFilter("")}
                    />
                  )}
                </>
              )}
            </div>

            <div className="space-y-4 md:col-span-2">
              {/* Expense list */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-[clamp(1.5rem,2.2vw,1.9rem)] font-bold text-gray-900 dark:text-gray-100">
                  {t("invoice.invoices")}
                </h2>
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
                  <AppSelect
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as OverviewStatus)
                    }
                    className={`h-10 w-full rounded-lg px-3.5 text-sm ${SELECT_TRIGGER}`}
                  >
                    <option value="all">{t("invoice.statusAll")}</option>
                    <option value="unpaid">{t("invoice.statusUnpaid")}</option>
                    <option value="remaining">
                      {t("dashboard.remainingLabel")}
                    </option>
                    <option value="partial">
                      {t("invoice.statusPartiallyPaid")}
                    </option>
                    <option value="overdue">
                      {t("invoice.statusOverdue")}
                    </option>
                    <option value="paid">{t("invoice.statusPaid")}</option>
                  </AppSelect>
                  <Button
                    type="button"
                    disabled={closed}
                    onClick={() => {
                      if (closed) return;
                      navigate(`/invoices/add?period=${resolvedPeriodId}`);
                    }}
                    icon={<Plus size={15} />}
                    className="w-full sm:w-auto"
                  >
                    {t("invoice.addInvoice")}
                  </Button>
                </div>
              </div>
              {!listInvoices || listInvoices.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("common.noData")}
                  </p>
                </div>
              ) : (
                visibleGroups.map((group) => {
                  if (group.list.length === 0) return null;
                  const groupSum = group.list.reduce(
                    (sum, item) => sum + item.displayCents,
                    0,
                  );
                  const groupTotal =
                    group.key === "partial"
                      ? group.list.reduce(
                          (sum, item) => sum + item.invoice.totalCents,
                          0,
                        )
                      : undefined;
                  return (
                    <div
                      key={group.key}
                      className={`bg-white dark:bg-gray-900 rounded-xl border ${group.borderClass} p-4 sm:p-5 shadow-sm`}
                    >
                      <div className="mb-3">
                        <p className={`text-base ${group.amountClass} mt-0.5`}>
                          <span className="font-semibold">
                            {group.key === "partial" && groupTotal !== undefined
                              ? t("invoice.partialHeader", {
                                  remaining: fmt(groupSum),
                                  total: fmt(groupTotal),
                                })
                              : group.title}
                          </span>
                          {group.key !== "partial" && <> - {fmt(groupSum)}</>}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-3 items-stretch md:grid-cols-2 md:gap-4 lg:grid-cols-3 lg:gap-5">
                        {group.list.map(
                          ({ invoice, totalPaid, remaining, displayCents }) => {
                            const paymentStatus = calcPaymentStatus(
                              invoice.totalCents,
                              totalPaid,
                            );
                            const isPaid = paymentStatus === "PAID";
                            const isPartiallyPaid =
                              paymentStatus === "PARTIALLY_PAID";
                            const status = getInvoiceStatus({
                              totalCents: invoice.totalCents,
                              totalPaidCents: totalPaid,
                              dueDate: invoice.dueDate,
                            });
                            const overdue = status === "OVERDUE";
                            const userShareEntry =
                              filter === "share-user"
                                ? (invoice.shares ?? []).find(
                                    (sh: any) => sh.userId === shareUserId,
                                  )
                                : undefined;
                            const shareRatio = userShareEntry
                              ? userShareEntry.shareCents / invoice.totalCents
                              : null;
                            const shareRemaining =
                              shareRatio !== null
                                ? Math.max(
                                    0,
                                    Math.round(
                                      invoice.totalCents * shareRatio -
                                        totalPaid * shareRatio,
                                    ),
                                  )
                                : null;
                            const shareTotalPaid =
                              shareRatio !== null
                                ? Math.max(
                                    0,
                                    Math.round(totalPaid * shareRatio),
                                  )
                                : null;
                            const primaryAmount =
                              shareRatio !== null
                                ? fmt(
                                    isPartiallyPaid && shareRemaining !== null
                                      ? shareRemaining
                                      : userShareEntry.shareCents,
                                  )
                                : fmt(displayCents);
                            const secondaryLabel =
                              !isPartiallyPaid && userShareEntry
                                ? `${t("dashboard.totalAmount")}: ${fmt(invoice.totalCents)}`
                                : undefined;

                            return (
                              <ExpenseItemCard
                                key={invoice.id}
                                vendor={invoice.vendor}
                                description={invoice.description}
                                logoUrl={getVendorLogo(invoice.vendor)}
                                amountLabel={primaryAmount}
                                shareLabel={secondaryLabel}
                                typeLabel={distributionLabel(
                                  invoice.distributionMethod,
                                  settings.locale,
                                  invoice.distribution as any,
                                )}
                                category={invoice.category}
                                dateLabel={formatDate(invoice.createdAt)}
                                paid={isPaid}
                                overdue={overdue}
                                paymentStatus={status}
                                overdueLabel={t("invoice.statusOverdue")}
                                showPaymentStatusPill={false}
                                focusRingClassName={
                                  isPaid
                                    ? "focus-visible:ring-success/45"
                                    : overdue
                                      ? "focus-visible:ring-danger/45"
                                      : isPartiallyPaid
                                        ? "focus-visible:ring-warning/45"
                                        : "focus-visible:ring-danger/45"
                                }
                                onClick={() =>
                                  navigate(`/invoices/${invoice.id}`)
                                }
                                amountTone={
                                  isPartiallyPaid ? "partial" : "default"
                                }
                                amountDetails={
                                  isPartiallyPaid
                                    ? [
                                        t("invoice.paidOfTotal", {
                                          paid: fmt(
                                            shareRatio !== null &&
                                              shareTotalPaid !== null
                                              ? shareTotalPaid
                                              : totalPaid,
                                          ),
                                          total: fmt(
                                            shareRatio !== null
                                              ? userShareEntry.shareCents
                                              : invoice.totalCents,
                                          ),
                                        }),
                                      ]
                                    : undefined
                                }
                                actionButton={
                                  <ActionIconBar
                                    stopPropagation
                                    items={[
                                      {
                                        key: "pay",
                                        icon: CircleCheckBig,
                                        label: t("invoice.registerPayment"),
                                        onClick: async () => {
                                          if (!currentUser || remaining <= 0)
                                            return;
                                          if (closed) {
                                            await notify(
                                              t(
                                                "invoice.closedPeriodPaymentBlocked",
                                              ),
                                              t("common.error"),
                                            );
                                            return;
                                          }
                                          try {
                                            await addPayment.mutateAsync({
                                              invoiceId: invoice.id,
                                              data: {
                                                paidById: currentUser.id,
                                                amountCents: remaining,
                                                paidAt:
                                                  new Date().toISOString(),
                                              },
                                            });
                                          } catch (error: unknown) {
                                            await notify(
                                              getApiErrorMessage(t, error),
                                              t("common.error"),
                                            );
                                          }
                                        },
                                        disabled:
                                          closed ||
                                          remaining <= 0 ||
                                          addPayment.isPending,
                                        hidden: closed,
                                        colorClassName:
                                          "bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-500 dark:text-green-400",
                                      },
                                      {
                                        key: "edit",
                                        icon: Pencil,
                                        label: t("common.edit"),
                                        onClick: () =>
                                          navigate(
                                            `/invoices/${invoice.id}/edit`,
                                          ),
                                        colorClassName:
                                          "bg-violet-500/10 hover:bg-violet-500/15 dark:bg-violet-500/20 dark:hover:bg-violet-500/25 text-violet-500",
                                      },
                                      {
                                        key: "delete",
                                        icon: Trash2,
                                        label: t("common.delete"),
                                        onClick: () =>
                                          deleteInvoice.mutate(invoice.id),
                                        destructive: true,
                                        confirmMessage: t(
                                          "invoice.confirmDelete",
                                        ),
                                        colorClassName:
                                          "bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-500 dark:text-red-400",
                                      },
                                    ]}
                                  />
                                }
                              />
                            );
                          },
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
