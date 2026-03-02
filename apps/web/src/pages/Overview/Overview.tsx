import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Receipt,
  DollarSign,
  TrendingUp,
  CircleCheckBig,
  CircleAlert,
  Users,
  Clock,
  Pencil,
  Trash2,
  Plus,
  RotateCcw,
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
import { isPeriodClosed } from "../../utils/periodStatus";
import { normalizeOverviewQuery, type OverviewStatus } from "./filtering";
import { SELECT_TRIGGER, FOCUS_RING } from "../../components/Common/focusStyles";
import AppSelect from "../../components/Common/AppSelect";
import PeriodStatusPill from "../../components/Common/PeriodStatusPill";

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

  const inputCls =
    `h-10 px-3 pr-10 rounded-lg text-sm ${SELECT_TRIGGER}`;

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

  const isLoading =
    periodsLoading || periodLoading || statsLoading || invoicesLoading;

  const userShare = stats?.userShares?.find(
    (s) => s.userId === currentUser?.id,
  );
  const closed = period ? isPeriodClosed(period) : false;

  const validUserIds = useMemo(() => new Set(users.map((u) => u.id)), [users]);
  const normalizedQuery = useMemo(
    () => normalizeOverviewQuery(searchParams, usersLoading ? undefined : validUserIds),
    [searchParams, usersLoading, validUserIds],
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

  const setFilter = (nextFilter: "all" | "share-user", su?: string) => {
    const params = new URLSearchParams(searchParams);
    if (nextFilter === "share-user" && su && (usersLoading || validUserIds.has(su))) {
      params.set("filter", "share-user");
      params.set("shareUser", su);
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
      const totalPaid = (invoice.payments ?? []).reduce(
        (sum, p) => sum + p.amountCents,
        0,
      );
      const remaining = Math.max(0, invoice.totalCents - totalPaid);
      if (remaining === 0) paidCents += invoice.totalCents;
      else owedCents += remaining;
    }
    return { paidCents, owedCents };
  }, [invoices]);

  const statusFilteredInvoices = useMemo(() => {
    const base = invoices ?? [];
    return base.filter((invoice) => {
      const totalPaid = (invoice.payments ?? []).reduce(
        (sum, p) => sum + p.amountCents,
        0,
      );
      const remaining = Math.max(0, invoice.totalCents - totalPaid);
      const dueAt = invoice.dueDate ? new Date(invoice.dueDate) : null;
      const isOverdue = remaining > 0 && !!dueAt && dueAt < new Date();
      if (statusFilter === "paid") return remaining <= 0;
      if (statusFilter === "remaining") return remaining > 0;
      if (statusFilter === "unpaid")
        return remaining > 0 && totalPaid === 0 && !isOverdue;
      if (statusFilter === "partial") return remaining > 0 && totalPaid > 0;
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
          const totalPaid = (invoice.payments ?? []).reduce(
            (sum, p) => sum + p.amountCents,
            0,
          );
          const remaining = Math.max(0, invoice.totalCents - totalPaid);
          const dueAt = invoice.dueDate ? new Date(invoice.dueDate) : null;
          const isOverdue = remaining > 0 && !!dueAt && dueAt < now;
          if (remaining <= 0)
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
          else if (totalPaid > 0)
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
      borderClass: "border-red-200 dark:border-red-900/50",
      titleClass: "text-red-700 dark:text-red-400",
      amountClass: "text-red-500 dark:text-red-400/80",
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
      amountClass: "text-primary",
    },
    {
      key: "partial",
      title: t("invoice.statusPartiallyPaid"),
      list: grouped.partial,
      show:
        statusFilter === "all" ||
        statusFilter === "remaining" ||
        statusFilter === "partial",
      borderClass: "border-amber-200 dark:border-amber-900/50",
      titleClass: "text-amber-700 dark:text-amber-400",
      amountClass: "text-amber-500 dark:text-amber-400/80",
    },
    {
      key: "paid",
      title: t("invoice.statusPaid"),
      list: grouped.paid,
      show:
        statusFilter === "all" || statusFilter === "paid",
      borderClass: "border-green-200 dark:border-green-900/50",
      titleClass: "text-green-700 dark:text-green-400",
      amountClass: "text-green-500 dark:text-green-400/80",
    },
  ].filter((g) => g.show);

  const getVendorLogo = (vendorName: string) =>
    vendors.find((v) => v.name.toLowerCase() === vendorName.toLowerCase())
      ?.logoUrl;

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
          {period && <PeriodStatusPill isClosed={closed} className="h-10 px-4" />}
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
                colorClass: "bg-primary",
                onClick: () => setFilter("all"),
              },
              {
                key: "users",
                icon: Users,
                label: t("period.userShares"),
                value: stats?.userShares?.length ?? 0,
                colorClass: "bg-primary",
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
                        <button
                          type="button"
                          onClick={() => setFilter("all")}
                          aria-label={t("common.reset")}
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${FOCUS_RING} ${
                            hasShareSelection
                              ? "border-primary/40 text-primary hover:bg-primary/10 dark:border-primary/40 dark:text-primary dark:hover:bg-primary/20"
                              : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <RotateCcw size={16} />
                        </button>
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
                      selectedShareUserId={hasShareSelection ? shareUserId : undefined}
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
                <div className="flex items-center gap-2">
                  <AppSelect
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as OverviewStatus)}
                    className={`h-10 rounded-lg ${SELECT_TRIGGER}`}
                  >
                    <option value="all">{t("invoice.statusAll")}</option>
                    <option value="unpaid">{t("invoice.statusUnpaid")}</option>
                    <option value="remaining">{t("dashboard.remainingLabel")}</option>
                    <option value="partial">{t("invoice.statusPartiallyPaid")}</option>
                    <option value="overdue">{t("invoice.statusOverdue")}</option>
                    <option value="paid">{t("invoice.statusPaid")}</option>
                  </AppSelect>
                  <button
                    type="button"
                    disabled={closed}
                    onClick={() => {
                      if (closed) return;
                      navigate(`/invoices/add?period=${resolvedPeriodId}`);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${closed ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed" : "bg-primary hover:bg-primary/90 text-white"}`}
                  >
                    <Plus size={15} />
                    {t("invoice.addInvoice")}
                  </button>
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
                  return (
                    <div
                      key={group.key}
                      className={`bg-white dark:bg-gray-900 rounded-xl border ${group.borderClass} p-4 sm:p-5 shadow-sm`}
                    >
                      <div className="mb-3">
                        <p className={`text-base ${group.amountClass} mt-0.5`}>
                          <span className="font-semibold">{group.title}</span> -{" "}
                          {fmt(groupSum)}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-3 items-stretch md:grid-cols-2 md:gap-4 lg:grid-cols-3 lg:gap-5">
                        {group.list.map(
                          ({ invoice, totalPaid, remaining, displayCents }) => {
                            const isPaid = remaining <= 0;
                            const isPartiallyPaid = totalPaid > 0 && !isPaid;
                            const dueAt = invoice.dueDate
                              ? new Date(invoice.dueDate)
                              : null;
                            const overdue =
                              !isPaid && !!dueAt && dueAt < new Date();
                            const userShareEntry =
                              filter === "share-user"
                                ? (invoice.shares ?? []).find(
                                    (sh: any) => sh.userId === shareUserId,
                                  )
                                : undefined;
                            const primaryAmount = userShareEntry
                              ? fmt(userShareEntry.shareCents)
                              : fmt(displayCents);
                            const secondaryLabel = userShareEntry
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
                                paidLabel={t("invoice.statusPaid")}
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
                                rightContent={
                                  isPartiallyPaid ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                      <Clock size={10} />{" "}
                                      {t("invoice.amountPaid")}:{" "}
                                      {fmt(totalPaid)}
                                    </span>
                                  ) : undefined
                                }
                                actionButton={
                                  <ActionIconBar
                                    stopPropagation
                                    items={[
                                      {
                                        key: "pay",
                                        icon: CircleCheckBig,
                                        label: t("invoice.markPaid"),
                                        onClick: () => {
                                          if (!currentUser || remaining <= 0)
                                            return;
                                          addPayment.mutate({
                                            invoiceId: invoice.id,
                                            data: {
                                              paidById: currentUser.id,
                                              amountCents: remaining,
                                              paidAt: new Date().toISOString(),
                                            },
                                          });
                                        },
                                        disabled:
                                          remaining <= 0 ||
                                          addPayment.isPending,
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
