import { useMemo } from "react";
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
  ChevronDown,
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
    "h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <select
          value={selectedPeriodId}
          onChange={(e) => onSelect(e.target.value)}
          className={`${inputCls} pr-7 appearance-none w-28 min-w-[7rem]`}
        >
          {sortedPeriods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </div>
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
    setSearchParams(params, { replace: true });
  };

  const { data: period, isLoading: periodLoading } = usePeriod(
    resolvedPeriodId,
  );
  const { data: stats, isLoading: statsLoading } = usePeriodStats(
    resolvedPeriodId,
  );
  const { data: invoices, isLoading: invoicesLoading } = useInvoices(
    resolvedPeriodId,
  );
  const { data: vendors = [] } = useVendors();
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

  const filter = searchParams.get("filter") || "all";
  const shareUserId = searchParams.get("shareUser") || "";
  const hasShareSelection = filter === "share-user" && !!shareUserId;

  const setFilter = (nextFilter: string, su?: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("filter", nextFilter);
    if (su) params.set("shareUser", su);
    else params.delete("shareUser");
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

  const now = new Date();
  const grouped = useMemo(
    () =>
      (invoices ?? []).reduce(
        (acc, invoice) => {
          const totalPaid = (invoice.payments ?? []).reduce(
            (sum, p) => sum + p.amountCents,
            0,
          );
          const remaining = Math.max(0, invoice.totalCents - totalPaid);
          const dueAt = invoice.dueDate ? new Date(invoice.dueDate) : null;
          const isOverdue = remaining > 0 && !!dueAt && dueAt < now;
          if (remaining <= 0)
            acc.paid.push({ invoice, totalPaid, remaining, displayCents: totalPaid });
          else if (isOverdue)
            acc.overdue.push({ invoice, totalPaid, remaining, displayCents: remaining });
          else if (totalPaid > 0)
            acc.partial.push({ invoice, totalPaid, remaining, displayCents: remaining });
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
    [invoices],
  );

  const filterByShare = (list: any[]) =>
    filter === "share-user"
      ? list.filter(({ invoice }) =>
          (invoice.shares ?? []).some((s: any) => s.userId === shareUserId),
        )
      : list;

  const visibleGroups = [
    {
      key: "overdue",
      title: t("invoice.statusOverdue"),
      list: filterByShare(grouped.overdue),
      show:
        filter === "all" || filter === "remaining" || filter === "share-user",
      borderClass: "border-red-200 dark:border-red-900/50",
      titleClass: "text-red-700 dark:text-red-400",
      amountClass: "text-red-500 dark:text-red-400/80",
    },
    {
      key: "unpaid",
      title: t("invoice.statusUnpaid"),
      list: filterByShare(grouped.unpaid),
      show:
        filter === "all" || filter === "remaining" || filter === "share-user",
      borderClass: "border-gray-200 dark:border-gray-800",
      titleClass: "text-gray-800 dark:text-gray-200",
      amountClass: "text-indigo-500 dark:text-indigo-400",
    },
    {
      key: "partial",
      title: t("invoice.statusPartiallyPaid"),
      list: filterByShare(grouped.partial),
      show:
        filter === "all" || filter === "remaining" || filter === "share-user",
      borderClass: "border-amber-200 dark:border-amber-900/50",
      titleClass: "text-amber-700 dark:text-amber-400",
      amountClass: "text-amber-500 dark:text-amber-400/80",
    },
    {
      key: "paid",
      title: t("invoice.statusPaid"),
      list: filterByShare(grouped.paid),
      show: filter === "all" || filter === "paid" || filter === "share-user",
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
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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
            <span
              className={`inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium ${
                !closed
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
              }`}
            >
              {!closed ? t("period.open") : t("period.closed")}
            </span>
          )}
        </div>
      </div>

      {isLoading && resolvedPeriodId ? (
        <div className="flex items-center justify-center min-h-32">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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
                onClick: () =>
                  setFilter("share-user", currentUser?.id),
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
                onClick: () => setFilter("paid"),
              },
              {
                key: "remaining",
                icon: CircleAlert,
                label: t("dashboard.remainingLabel"),
                value: fmt(paidUnpaid.owedCents),
                colorClass: "bg-red-500",
                onClick: () => setFilter("remaining"),
              },
              {
                key: "invoices",
                icon: Receipt,
                label: t("dashboard.totalInvoices"),
                value: stats?.totalInvoices ?? 0,
                colorClass: "bg-indigo-500",
                onClick: () => setFilter("all"),
              },
              {
                key: "users",
                icon: Users,
                label: t("period.userShares"),
                value: stats?.userShares?.length ?? 0,
                colorClass: "bg-sky-500",
                onClick: () =>
                  setFilter("share-user", currentUser?.id),
              },
            ]}
          />

          {/* Charts */}
          {((stats?.userShares && stats.userShares.length > 0) ||
            (invoices && invoices.length > 0)) && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
              <div>
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
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                          hasShareSelection
                            ? "border-indigo-300 text-indigo-500 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
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
                      selectedUserId={hasShareSelection ? shareUserId : undefined}
                    />
                  </div>
                )}
              </div>
              <div>
                {invoices && invoices.length > 0 && (
                  <SpendBreakdownCard
                    invoices={invoices}
                    currentUserId={currentUser?.id}
                    currency={currency}
                    title={t("period.categoryBreakdown")}
                  />
                )}
              </div>
            </div>
          )}

          {/* Expense list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-[clamp(1.5rem,2.2vw,1.9rem)] font-bold text-gray-900 dark:text-gray-100">
                {t("invoice.invoices")}
              </h2>
              <button
                onClick={() => navigate("/invoices/add")}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <Plus size={15} />
                {t("invoice.addInvoice")}
              </button>
            </div>
            {!invoices || invoices.length === 0 ? (
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
                        <span className="font-semibold">{group.title}</span> - {fmt(groupSum)}
                      </p>
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2.5">
                      {group.list.map(
                        ({
                          invoice,
                          totalPaid,
                          remaining,
                          displayCents,
                        }) => {
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
                                        if (
                                          !currentUser ||
                                          remaining <= 0
                                        )
                                          return;
                                        addPayment.mutate({
                                          invoiceId: invoice.id,
                                          data: {
                                            paidById: currentUser.id,
                                            amountCents: remaining,
                                            paidAt:
                                              new Date().toISOString(),
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
                                        "bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-500 dark:text-indigo-400",
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
        </>
      )}
    </div>
  );
}
