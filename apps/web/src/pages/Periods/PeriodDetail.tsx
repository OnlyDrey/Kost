import { useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Receipt,
  DollarSign,
  TrendingUp,
  Users,
  CircleCheckBig,
  CircleAlert,
  Pencil,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
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
import PeriodStatusBadge from "../../components/Common/PeriodStatusBadge";
import { useConfirmDialog } from "../../components/Common/ConfirmDialogProvider";
import { getApiErrorMessage } from "../../utils/apiErrors";
import { getInvoiceStatus } from "../../utils/invoiceStatus";

export default function PeriodDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const { settings } = useSettings();

  const { data: period, isLoading: periodLoading } = usePeriod(id!);
  const { data: stats, isLoading: statsLoading } = usePeriodStats(id!);
  const { data: invoices, isLoading: invoicesLoading } = useInvoices(id!);
  const { data: vendors = [] } = useVendors();
  const deleteInvoice = useDeleteInvoice();
  const addPayment = useAddPayment();
  const isLoading = periodLoading || statsLoading || invoicesLoading;
  const { data: currency = "NOK" } = useCurrency();
  const fmt = useCurrencyFormatter();
  const { notify } = useConfirmDialog();

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!period) {
    return <p className="text-sm text-gray-500">{t("errors.notFound")}</p>;
  }

  const userShare = stats?.userShares?.find(
    (s) => s.userId === currentUser?.id,
  );
  const closed = isPeriodClosed(period);

  const filter = searchParams.get("filter") || "all";
  const shareUserId = searchParams.get("shareUser") || currentUser?.id || "";
  const hasShareSelection = filter === "share-user" && Boolean(shareUserId);
  const selectedShareUser = hasShareSelection
    ? stats?.userShares?.find((share) => share.userId === shareUserId)
    : undefined;
  const setFilter = (nextFilter: string, shareUserId?: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("filter", nextFilter);
    if (shareUserId) params.set("shareUser", shareUserId);
    else params.delete("shareUser");
    setSearchParams(params, { replace: true });
  };

  const now = new Date();
  const grouped = (invoices ?? []).reduce(
    (acc, invoice) => {
      const totalPaid = (invoice.payments ?? []).reduce(
        (sum, p) => sum + p.amountCents,
        0,
      );
      const remaining = Math.max(0, invoice.totalCents - totalPaid);
      const dueAt = invoice.dueDate ? new Date(invoice.dueDate) : null;
      const isOverdue = remaining > 0 && !!dueAt && dueAt < now;
      if (remaining <= 0) {
        acc.paid.push({
          invoice,
          totalPaid,
          remaining,
          displayCents: totalPaid,
        });
      } else if (isOverdue) {
        acc.overdue.push({
          invoice,
          totalPaid,
          remaining,
          displayCents: remaining,
        });
      } else if (totalPaid > 0) {
        acc.partial.push({
          invoice,
          totalPaid,
          remaining,
          displayCents: remaining,
        });
      } else {
        acc.unpaid.push({
          invoice,
          totalPaid,
          remaining,
          displayCents: invoice.totalCents,
        });
      }
      return acc;
    },
    {
      overdue: [] as any[],
      unpaid: [] as any[],
      partial: [] as any[],
      paid: [] as any[],
    },
  );

  const filterByShare = (list: any[]) =>
    filter === "share-user"
      ? list.filter(({ invoice }) =>
          (invoice.shares ?? []).some(
            (s: { userId: string }) => s.userId === shareUserId,
          ),
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
      amountClass: "text-gray-900 dark:text-gray-100",
    },
    {
      key: "unpaid",
      title: t("invoice.statusUnpaid"),
      list: filterByShare(grouped.unpaid),
      show:
        filter === "all" || filter === "remaining" || filter === "share-user",
      borderClass: "border-gray-200 dark:border-gray-800",
      titleClass: "text-gray-800 dark:text-gray-200",
      amountClass: "text-gray-900 dark:text-gray-100",
    },
    {
      key: "partial",
      title: t("invoice.statusPartiallyPaid"),
      list: filterByShare(grouped.partial),
      show:
        filter === "all" || filter === "remaining" || filter === "share-user",
      borderClass: "border-amber-200 dark:border-amber-900/50",
      titleClass: "text-amber-700 dark:text-amber-400",
      amountClass: "text-gray-900 dark:text-gray-100",
    },
    {
      key: "paid",
      title: t("invoice.statusPaid"),
      list: filterByShare(grouped.paid),
      show: filter === "all" || filter === "paid" || filter === "share-user",
      borderClass: "border-green-200 dark:border-green-900/50",
      titleClass: "text-green-700 dark:text-green-400",
      amountClass: "text-gray-900 dark:text-gray-100",
    },
  ].filter((group) => group.show);

  const getVendorLogo = (vendorName: string) =>
    vendors.find((v) => v.name.toLowerCase() === vendorName.toLowerCase())
      ?.logoUrl;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/periods")}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {period.id}
            </h1>
            <PeriodStatusBadge status={closed ? "CLOSED" : "OPEN"} />
          </div>
          {period.closedAt && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {t("period.closedAt", { date: formatDate(period.closedAt) })}
            </p>
          )}
        </div>
      </div>

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

      {((stats?.userShares && stats.userShares.length > 0) ||
        (invoices && invoices.length > 0)) && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
          <div>
            {invoices && invoices.length > 0 && (
              <SpendBreakdownCard
                invoices={invoices}
                currentUserId={currentUser?.id}
                selectedShareUserId={
                  hasShareSelection ? shareUserId : undefined
                }
                selectedShareUserName={selectedShareUser?.userName}
                currency={currency}
                title={t("period.categoryBreakdown")}
              />
            )}
          </div>

          <div>
            {stats?.userShares && stats.userShares.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {t("period.userShares")}
                </h2>
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
                  onSelectShare={(userId) => setFilter("share-user", userId)}
                  selectedUserId={
                    filter === "share-user" ? shareUserId : undefined
                  }
                />
              </div>
            )}
          </div>

          <div />
        </div>
      )}

      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
          {t("invoice.invoices")}
        </h2>
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
                  <h3 className={`text-base font-semibold ${group.titleClass}`}>
                    {group.key === "partial" && groupTotal !== undefined
                      ? t("invoice.partialHeader", {
                          remaining: fmt(groupSum),
                          total: fmt(groupTotal),
                        })
                      : group.title}
                  </h3>
                  {group.key !== "partial" && (
                    <p
                      className={`text-sm font-medium ${group.amountClass} mt-0.5`}
                    >
                      {fmt(groupSum)}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-4 2xl:grid-cols-6 gap-2.5">
                  {group.list.map(
                    ({ invoice, totalPaid, remaining, displayCents }) => {
                      const isPaid = remaining <= 0;
                      const isPartiallyPaid = totalPaid > 0 && !isPaid;
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
                      // When "Your Share" mode is active: primary = share, secondary = total
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
                          ? Math.max(0, Math.round(totalPaid * shareRatio))
                          : null;
                      const primaryAmount =
                        shareRatio !== null
                          ? fmt(
                              isPartiallyPaid && shareRemaining !== null
                                ? shareRemaining
                                : userShareEntry.shareCents,
                            )
                          : fmt(displayCents);
                      const secondaryLabel = isPartiallyPaid
                        ? t("invoice.totalWithAmount", {
                            amount: fmt(
                              shareRatio !== null
                                ? userShareEntry.shareCents
                                : invoice.totalCents,
                            ),
                          })
                        : userShareEntry
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
                          paid={status === "PAID"}
                          overdue={overdue}
                          paymentStatus={status}
                          overdueLabel={t("invoice.statusOverdue")}
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                          amountTone={isPartiallyPaid ? "partial" : "default"}
                          amountDetails={
                            isPartiallyPaid
                              ? [
                                  t("invoice.remainingOfTotal", {
                                    remaining: fmt(
                                      shareRatio !== null &&
                                        shareRemaining !== null
                                        ? shareRemaining
                                        : remaining,
                                    ),
                                    total: fmt(
                                      shareRatio !== null
                                        ? userShareEntry.shareCents
                                        : invoice.totalCents,
                                    ),
                                  }),
                                  t("invoice.paidWithAmount", {
                                    amount: fmt(
                                      shareRatio !== null &&
                                        shareTotalPaid !== null
                                        ? shareTotalPaid
                                        : totalPaid,
                                    ),
                                  }),
                                ]
                              : undefined
                          }
                          actionButton={
                            <ActionIconBar
                              tight
                              stopPropagation
                              items={[
                                {
                                  key: "pay",
                                  icon: CircleCheckBig,
                                  label: t("invoice.registerPayment"),
                                  onClick: async () => {
                                    if (!currentUser || remaining <= 0) return;
                                    if (closed) {
                                      await notify(
                                        t("invoice.closedPeriodPaymentBlocked"),
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
                                          paidAt: new Date().toISOString(),
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
                                    "bg-success/20 hover:bg-success/30 text-success",
                                },
                                {
                                  key: "edit",
                                  icon: Pencil,
                                  label: t("common.edit"),
                                  onClick: () =>
                                    navigate(`/invoices/${invoice.id}/edit`),
                                  colorClassName:
                                    "bg-primary/20 hover:bg-primary/30 text-primary",
                                },
                                {
                                  key: "delete",
                                  icon: Trash2,
                                  label: t("common.delete"),
                                  onClick: () =>
                                    deleteInvoice.mutate(invoice.id),
                                  destructive: true,
                                  confirmMessage: t("invoice.confirmDelete"),
                                  colorClassName:
                                    "bg-danger/20 hover:bg-danger/30 text-danger",
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
  );
}
