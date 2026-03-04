import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Receipt,
  DollarSign,
  TrendingUp,
  CircleCheckBig,
  CircleAlert,
  Users,
} from "lucide-react";
import {
  useCurrentPeriod,
  useInvoices,
  usePeriodStats,
  useCurrencyFormatter,
  useCurrency,
} from "../hooks/useApi";
import { useAuth } from "../stores/auth.context";
import TileGrid from "../components/Common/TileGrid";
import SpendBreakdownCard from "../components/Common/SpendBreakdownCard";
import UserSharesGrid from "../components/Invoice/UserSharesGrid";
import PeriodStatusBadge from "../components/Common/PeriodStatusBadge";

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: currentPeriod, isLoading: periodLoading } = useCurrentPeriod();
  const { data: invoices, isLoading: invoicesLoading } = useInvoices(
    currentPeriod?.id,
  );
  const { data: stats, isLoading: statsLoading } = usePeriodStats(
    currentPeriod?.id || "",
  );
  const { data: currency = "NOK" } = useCurrency();
  const fmt = useCurrencyFormatter();

  const userShare = stats?.userShares?.find(
    (share) => share.userId === user?.id,
  );
  const isLoading = periodLoading || invoicesLoading || statsLoading;

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
      if (remaining === 0) {
        paidCents += invoice.totalCents;
      } else {
        owedCents += remaining;
      }
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

  const userTotalCents = userShare?.totalShareCents ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t("dashboard.title")}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t("dashboard.currentPeriod")}:{" "}
          <span className="font-medium">
            {currentPeriod?.id || t("common.noData")}
          </span>
          {currentPeriod && (
            <PeriodStatusBadge
              status={currentPeriod.status === "OPEN" ? "OPEN" : "CLOSED"}
              variant="field"
              className="ml-2"
            />
          )}
        </p>
      </div>

      <TileGrid
        items={[
          {
            key: "your-share",
            icon: TrendingUp,
            label: t("dashboard.yourShare"),
            value: fmt(userTotalCents),
            colorClass: "bg-amber-500",
            onClick: () =>
              currentPeriod &&
              navigate(
                `/periods/${currentPeriod.id}?filter=share-user&shareUser=${user?.username ?? user?.id ?? ""}`,
              ),
          },
          {
            key: "total",
            icon: DollarSign,
            label: t("dashboard.totalAmount"),
            value: fmt(stats?.totalAmountCents ?? 0),
            colorClass: "bg-emerald-500",
            onClick: () =>
              currentPeriod &&
              navigate(`/periods/${currentPeriod.id}?filter=all`),
          },
          {
            key: "paid",
            icon: CircleCheckBig,
            label: t("dashboard.paidLabel"),
            value: fmt(paidUnpaid.paidCents),
            colorClass: "bg-green-500",
            onClick: () =>
              currentPeriod &&
              navigate(`/periods/${currentPeriod.id}?filter=paid`),
          },
          {
            key: "remaining",
            icon: CircleAlert,
            label: t("dashboard.remainingLabel"),
            value: fmt(paidUnpaid.owedCents),
            colorClass: "bg-red-500",
            onClick: () =>
              currentPeriod &&
              navigate(`/periods/${currentPeriod.id}?filter=remaining`),
          },
          {
            key: "total-invoices",
            icon: Receipt,
            label: t("dashboard.totalInvoices"),
            value: stats?.totalInvoices ?? 0,
            colorClass: "bg-primary",
            onClick: () =>
              currentPeriod &&
              navigate(`/periods/${currentPeriod.id}?filter=all`),
          },
          {
            key: "users",
            icon: Users,
            label: t("period.userShares"),
            value: stats?.userShares?.length ?? 0,
            colorClass: "bg-primary",
            onClick: () =>
              currentPeriod &&
              navigate(
                `/periods/${currentPeriod.id}?filter=share-user&shareUser=${user?.username ?? user?.id ?? ""}`,
              ),
          },
        ]}
      />

      {((invoices && invoices.length > 0) ||
        (stats?.userShares && stats.userShares.length > 0)) && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
          <div>
            {invoices && invoices.length > 0 && (
              <SpendBreakdownCard
                invoices={invoices}
                currentUserId={user?.id}
                currency={currency}
                title={t("dashboard.categoryBreakdown")}
              />
            )}
          </div>

          <div>
            {stats?.userShares && stats.userShares.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
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
                  onSelectShare={(userId) =>
                    currentPeriod &&
                    navigate(
                      `/periods/${currentPeriod.id}?filter=share-user&shareUser=${userId}`,
                    )
                  }
                  selectedUserId={undefined}
                />
              </div>
            )}
          </div>

          <div />
        </div>
      )}
    </div>
  );
}
