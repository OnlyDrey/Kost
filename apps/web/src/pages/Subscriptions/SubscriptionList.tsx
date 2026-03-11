import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Power,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Circle,
  CircleX,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useSubscriptions,
  useToggleSubscription,
  useDeleteSubscription,
  useGenerateSubscriptionInvoices,
  useCurrentPeriod,
  useCurrencyFormatter,
  usePeriods,
  useVendors,
} from "../../hooks/useApi";
import { Subscription } from "../../services/api";
import { formatDate } from "../../utils/date";
import { getVendorLogoUrl } from "../../utils/vendorLogo";
import { useSettings } from "../../stores/settings.context";
import ExpenseItemCard from "../../components/Expense/ExpenseItemCard";
import ActionIconBar from "../../components/Common/ActionIconBar";
import TagPill from "../../components/Common/TagPill";
import { distributionLabel } from "../../utils/distribution";
import {
  FOCUS_RING,
  SELECT_TRIGGER,
  CONTROL_HEIGHT,
} from "../../components/Common/focusStyles";
import AppSelect from "../../components/Common/AppSelect";

export default function SubscriptionList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: subscriptions = [], isLoading } = useSubscriptions();
  const { settings } = useSettings();
  const { data: currentPeriod } = useCurrentPeriod();
  const { data: periods = [] } = usePeriods();
  const { data: vendors = [] } = useVendors();

  const toggleSub = useToggleSubscription();
  const deleteSub = useDeleteSubscription();
  const generateInvoices = useGenerateSubscriptionInvoices();

  const [generateResult, setGenerateResult] = React.useState("");
  const [generateError, setGenerateError] = React.useState("");
  const [generatePeriodId, setGeneratePeriodId] = React.useState("");
  const openPeriods = React.useMemo(
    () => periods.filter((period) => period.status === "OPEN"),
    [periods],
  );

  React.useEffect(() => {
    if (generatePeriodId || openPeriods.length === 0) return;
    const fallbackPeriod =
      openPeriods.find((period) => period.id === currentPeriod?.id)?.id ??
      openPeriods[0].id;
    setGeneratePeriodId(fallbackPeriod);
  }, [currentPeriod?.id, generatePeriodId, openPeriods]);

  React.useEffect(() => {
    if (!generatePeriodId) return;
    if (openPeriods.some((period) => period.id === generatePeriodId)) return;
    setGenerateError(t("subscription.closedPeriodError"));
    setGeneratePeriodId(openPeriods[0]?.id ?? "");
  }, [generatePeriodId, openPeriods, t]);

  const handleGenerate = async () => {
    if (!generatePeriodId) return;
    setGenerateResult("");
    setGenerateError("");
    try {
      const result = await generateInvoices.mutateAsync(generatePeriodId);
      setGenerateResult(result.message);
    } catch (err: any) {
      setGenerateError(
        err?.response?.data?.message || t("subscription.generateError"),
      );
    }
  };

  const active = subscriptions.filter((s) => s.active);
  const inactive = subscriptions.filter((s) => !s.active);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t("subscription.title")}
          </h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {openPeriods.length > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                <AppSelect
                  value={generatePeriodId}
                  onChange={(e) => setGeneratePeriodId(e.target.value)}
                  className={`${CONTROL_HEIGHT} ${SELECT_TRIGGER}`}
                >
                  {openPeriods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.id}
                    </option>
                  ))}
                </AppSelect>
                <button
                  onClick={handleGenerate}
                  disabled={generateInvoices.isPending || !generatePeriodId}
                  className={`inline-flex ${CONTROL_HEIGHT} items-center gap-2 border border-primary/60 bg-primary/10 text-primary hover:bg-primary/20 px-3 rounded-lg text-sm font-semibold transition-colors ${FOCUS_RING}`}
                >
                  {generateInvoices.isPending ? (
                    <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RefreshCw size={15} />
                  )}
                  {t("subscription.generateForPeriod")}
                </button>
              </div>
            )}
            <button
              onClick={() => navigate("/subscriptions/add")}
              className={`w-full sm:w-auto flex ${CONTROL_HEIGHT} items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 rounded-lg text-sm font-semibold transition-colors ${FOCUS_RING}`}
            >
              <Plus size={16} />
              {t("subscription.addRecurringExpense")}
            </button>
          </div>
        </div>
        {openPeriods.length > 0 && (
          <div className="sm:hidden grid grid-cols-3 gap-2">
            <AppSelect
              value={generatePeriodId}
              onChange={(e) => setGeneratePeriodId(e.target.value)}
              className={`${CONTROL_HEIGHT} w-full ${SELECT_TRIGGER}`}
              wrapperClassName="col-span-1"
            >
              {openPeriods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.id}
                </option>
              ))}
            </AppSelect>
            <button
              onClick={handleGenerate}
              disabled={generateInvoices.isPending || !generatePeriodId}
              className={`col-span-2 w-full flex ${CONTROL_HEIGHT} items-center justify-center gap-2 border border-primary/60 bg-primary/10 text-primary hover:bg-primary/20 px-3 rounded-lg text-sm font-semibold transition-colors ${FOCUS_RING}`}
            >
              {generateInvoices.isPending ? (
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <RefreshCw size={15} />
              )}
              {t("subscription.generateForPeriod")}
            </button>
          </div>
        )}
      </div>

      {generateResult && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg px-4 py-3 text-sm">
          <CheckCircle2 size={15} className="flex-shrink-0" />
          <span>{generateResult}</span>
        </div>
      )}
      {generateError && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span>{generateError}</span>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {t("subscription.activeSection", { count: active.length })}
        </h2>
        {active.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("subscription.noActive")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 items-stretch md:grid-cols-2 md:gap-4 lg:grid-cols-3 lg:gap-5">
            {active.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                sub={sub}
                locale={settings.locale}
                onEdit={() => navigate(`/subscriptions/${sub.id}/edit`)}
                onToggle={() => toggleSub.mutate(sub.id)}
                onDelete={() => deleteSub.mutate(sub.id)}
                deleteConfirmMessage={t("subscription.confirmDelete", {
                  name: sub.name,
                })}
                logoUrl={getVendorLogoUrl(vendors, sub.vendor)}
              />
            ))}
          </div>
        )}
      </div>

      {inactive.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {t("subscription.inactiveSection", { count: inactive.length })}
          </h2>
          <div className="grid grid-cols-1 gap-3 items-stretch md:grid-cols-2 md:gap-4 lg:grid-cols-3 lg:gap-5">
            {inactive.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                sub={sub}
                locale={settings.locale}
                onEdit={() => navigate(`/subscriptions/${sub.id}/edit`)}
                onToggle={() => toggleSub.mutate(sub.id)}
                onDelete={() => deleteSub.mutate(sub.id)}
                deleteConfirmMessage={t("subscription.confirmDelete", {
                  name: sub.name,
                })}
                logoUrl={getVendorLogoUrl(vendors, sub.vendor)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SubscriptionCard({
  sub,
  locale,
  onEdit,
  onToggle,
  onDelete,
  deleteConfirmMessage,
  logoUrl,
}: {
  sub: Subscription;
  locale: string;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  deleteConfirmMessage: string;
  logoUrl?: string;
}) {
  const { t } = useTranslation();
  const fmt = useCurrencyFormatter();

  const freqLabel = (value: string) => {
    if (value === "MONTHLY") return t("subscription.monthly");
    if (value === "QUARTERLY") return t("subscription.quarterly");
    if (value === "YEARLY") return t("subscription.yearly");
    if (
      value === "CUSTOM" ||
      !["MONTHLY", "QUARTERLY", "YEARLY"].includes(value)
    )
      return value;
    return value;
  };

  const methodLabel = distributionLabel(
    sub.distributionMethod,
    locale,
    sub.distributionRules as any,
  );
  const statusLabel =
    sub.status === "ACTIVE"
      ? t("subscription.statusActive")
      : sub.status === "PAUSED"
        ? t("subscription.statusPaused")
        : t("subscription.statusCanceled");
  const toggleLabel = sub.active
    ? t("subscription.deactivate")
    : t("subscription.activate");

  return (
    <ExpenseItemCard
      vendor={sub.vendor}
      description={sub.description ?? sub.name}
      typeLabel={methodLabel}
      category={sub.category}
      amountLabel={fmt(sub.amountCents)}
      showPaymentStatusPill={false}
      logoUrl={logoUrl}
      dateLabel={
        sub.nextBillingAt
          ? t("subscription.nextBillingShort", {
              date: formatDate(sub.nextBillingAt),
            })
          : undefined
      }
      amountDetails={
        sub.lastGenerated
          ? [
              t("subscription.lastGenerated", {
                date: formatDate(sub.lastGenerated),
              }),
            ]
          : undefined
      }
      footerContent={
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center flex-wrap gap-1.5">
            <TagPill
              label={statusLabel}
              variant={
                sub.status === "ACTIVE"
                  ? "success"
                  : sub.status === "PAUSED"
                    ? "neutral"
                    : "danger"
              }
              icon={
                sub.status === "ACTIVE" ? (
                  <Circle
                    size={12}
                    className="fill-current stroke-current"
                    aria-hidden
                  />
                ) : sub.status === "PAUSED" ? (
                  <Circle size={12} aria-hidden />
                ) : (
                  <CircleX size={12} aria-hidden />
                )
              }
            />
            <TagPill
              label={freqLabel(sub.frequency)}
              variant="frequency"
              icon={<Calendar size={12} aria-hidden />}
            />
          </div>
          <ActionIconBar
            tight
            items={[
              {
                key: "edit",
                icon: Pencil,
                label: t("common.edit"),
                onClick: onEdit,
                colorClassName:
                  "border-violet-500/45 bg-violet-500/20 text-violet-300 hover:bg-violet-500/30",
              },
              {
                key: "toggle",
                icon: Power,
                label: toggleLabel,
                onClick: onToggle,
                colorClassName: sub.active
                  ? "border-emerald-500/45 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                  : "border-gray-500/35 bg-slate-800/70 text-gray-400 hover:bg-slate-700/70",
              },
              {
                key: "delete",
                icon: Trash2,
                label: t("common.delete"),
                onClick: onDelete,
                destructive: true,
                confirmMessage: deleteConfirmMessage,
                colorClassName:
                  "border-red-500/45 bg-red-500/20 text-red-300 hover:bg-red-500/30",
              },
            ]}
          />
        </div>
      }
    />
  );
}
