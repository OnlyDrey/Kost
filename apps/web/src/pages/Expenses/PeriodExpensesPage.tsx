import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, Pencil, CheckCircle2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppSelect from "../../components/Common/AppSelect";
import {
  useAddPayment,
  useCurrencyFormatter,
  useDeleteInvoice,
  useInvoices,
  usePeriods,
  useVendors,
} from "../../hooks/useApi";
import { formatDate } from "../../utils/date";
import {
  distributionFilterMatch,
  distributionLabel,
} from "../../utils/distribution";
import { useSettings } from "../../stores/settings.context";
import { useAuth } from "../../stores/auth.context";
import ExpenseItemCard from "../../components/Expense/ExpenseItemCard";
import { getVendorLogoUrl } from "../../utils/vendorLogo";
import ActionIconBar from "../../components/Common/ActionIconBar";
import { useConfirmDialog } from "../../components/Common/ConfirmDialogProvider";
import { isPeriodClosed } from "../../utils/periodStatus";
import { getApiErrorMessage } from "../../utils/apiErrors";
import { getInvoiceStatus } from "../../utils/invoiceStatus";
import {
  calcPaidSum,
  calcPaymentStatus,
  calcRemaining,
} from "../../utils/paymentMath";
import PeriodStatusBadge from "../../components/Common/PeriodStatusBadge";
import { Button } from "../../components/ui/button";
import {
  CONTROL_HEIGHT,
  SELECT_TRIGGER,
} from "../../components/Common/focusStyles";

const METHOD_OPTIONS = [
  "ALL",
  "BY_INCOME",
  "BY_PERCENT",
  "FIXED_EQUAL",
  "FIXED_AMOUNT",
] as const;

const STATUS_OPTIONS = [
  "all",
  "unpaid",
  "remaining",
  "partial",
  "overdue",
  "paid",
] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number];

function resolvePeriodId(periods: { id: string }[], requested?: string | null) {
  if (requested && periods.some((period) => period.id === requested)) {
    return requested;
  }
  return [...periods].sort((a, b) => b.id.localeCompare(a.id))[0]?.id ?? "";
}

export default function PeriodExpensesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { user } = useAuth();
  const { notify } = useConfirmDialog();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: periods = [] } = usePeriods();
  const selectedPeriodId = resolvePeriodId(periods, searchParams.get("period"));
  const selectedPeriod = periods.find(
    (period) => period.id === selectedPeriodId,
  );

  const { data: invoices, isLoading } = useInvoices(selectedPeriodId);
  const { data: vendors = [] } = useVendors();

  const deleteInvoice = useDeleteInvoice();
  const addPayment = useAddPayment();
  const fmt = useCurrencyFormatter();

  const periodClosed = selectedPeriod ? isPeriodClosed(selectedPeriod) : false;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMethod, setFilterMethod] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          (invoices ?? []).map((invoice) => invoice.category).filter(Boolean),
        ),
      ),
    [invoices],
  );

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      ),
    [categories],
  );

  const invoicesBeforeMethodAndStatusFilter = useMemo(() => {
    const base = invoices ?? [];
    return base.filter((invoice) => {
      const searchText =
        `${invoice.vendor} ${invoice.description || ""} ${invoice.category}`.toLowerCase();
      const matchesSearch = searchText.includes(searchQuery.toLowerCase());
      const matchesCategory =
        filterCategory === "ALL" || invoice.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [invoices, searchQuery, filterCategory]);

  const statusMatches = (
    invoice: (typeof invoicesBeforeMethodAndStatusFilter)[number],
  ) => {
    const totalPaid = calcPaidSum(invoice.payments);
    const remaining = calcRemaining(invoice.totalCents, totalPaid);
    const dueAt = invoice.dueDate ? new Date(invoice.dueDate) : null;
    const overdue = remaining > 0 && !!dueAt && dueAt < new Date();
    const paymentStatus = calcPaymentStatus(invoice.totalCents, totalPaid);

    if (filterStatus === "paid") return paymentStatus === "PAID";
    if (filterStatus === "remaining") return paymentStatus !== "PAID";
    if (filterStatus === "unpaid")
      return paymentStatus === "UNPAID" && !overdue;
    if (filterStatus === "partial") return paymentStatus === "PARTIALLY_PAID";
    if (filterStatus === "overdue") return overdue;
    return true;
  };

  const invoicesBeforeStatusFilter = useMemo(
    () =>
      invoicesBeforeMethodAndStatusFilter.filter((invoice) =>
        distributionFilterMatch(
          invoice.distributionMethod,
          filterMethod,
          invoice.distribution as never,
        ),
      ),
    [invoicesBeforeMethodAndStatusFilter, filterMethod],
  );

  const availableStatusSet = useMemo(() => {
    const set = new Set<Exclude<StatusFilter, "all">>();
    const now = new Date();

    for (const invoice of invoicesBeforeStatusFilter) {
      const totalPaid = calcPaidSum(invoice.payments);
      const remaining = calcRemaining(invoice.totalCents, totalPaid);
      const dueAt = invoice.dueDate ? new Date(invoice.dueDate) : null;
      const overdue = remaining > 0 && !!dueAt && dueAt < now;
      const paymentStatus = calcPaymentStatus(invoice.totalCents, totalPaid);

      if (paymentStatus === "PAID") set.add("paid");
      if (paymentStatus !== "PAID") set.add("remaining");
      if (paymentStatus === "PARTIALLY_PAID") set.add("partial");
      if (paymentStatus === "UNPAID" && !overdue) set.add("unpaid");
      if (overdue) set.add("overdue");
    }

    return set;
  }, [invoicesBeforeStatusFilter]);

  const statusOptions = useMemo(
    () =>
      [
        { value: "all", label: t("invoice.statusAll") },
        { value: "unpaid", label: t("invoice.statusUnpaid") },
        { value: "remaining", label: t("dashboard.remainingLabel") },
        { value: "partial", label: t("invoice.statusPartiallyPaid") },
        { value: "overdue", label: t("invoice.statusOverdue") },
        { value: "paid", label: t("invoice.statusPaid") },
      ].filter(
        (option) =>
          option.value === "all" ||
          availableStatusSet.has(option.value as Exclude<StatusFilter, "all">),
      ),
    [availableStatusSet, t],
  );

  const availableMethodSet = useMemo(() => {
    const set = new Set<string>();

    for (const invoice of invoicesBeforeMethodAndStatusFilter) {
      if (!statusMatches(invoice)) continue;
      if (invoice.distributionMethod === "BY_INCOME") set.add("BY_INCOME");
      else if (invoice.distributionMethod === "BY_PERCENT")
        set.add("BY_PERCENT");
      else if (invoice.distributionMethod === "FIXED") {
        const dist = invoice.distribution as
          | { fixedMode?: string; mode?: string }
          | undefined;
        const fixedMode = dist?.fixedMode ?? dist?.mode;
        set.add(fixedMode === "AMOUNT" ? "FIXED_AMOUNT" : "FIXED_EQUAL");
      }
    }

    return set;
  }, [invoicesBeforeMethodAndStatusFilter, filterStatus]);

  const methodOptions = useMemo(
    () =>
      METHOD_OPTIONS.filter(
        (method) => method === "ALL" || availableMethodSet.has(method),
      ),
    [availableMethodSet],
  );

  useEffect(() => {
    if (filterStatus !== "all" && !availableStatusSet.has(filterStatus)) {
      setFilterStatus("all");
    }
  }, [filterStatus, availableStatusSet]);

  useEffect(() => {
    if (filterMethod !== "ALL" && !availableMethodSet.has(filterMethod)) {
      setFilterMethod("ALL");
    }
  }, [filterMethod, availableMethodSet]);

  const filteredInvoices = useMemo(
    () =>
      invoicesBeforeStatusFilter.filter((invoice) => statusMatches(invoice)),
    [invoicesBeforeStatusFilter, filterStatus],
  );

  const now = new Date();
  const groups = useMemo(
    () =>
      filteredInvoices.reduce(
        (acc, invoice) => {
          const totalPaid = calcPaidSum(invoice.payments);
          const remaining = calcRemaining(invoice.totalCents, totalPaid);
          const dueAt = invoice.dueDate ? new Date(invoice.dueDate) : null;
          const isOverdue = remaining > 0 && !!dueAt && dueAt < now;
          const paymentStatus = calcPaymentStatus(
            invoice.totalCents,
            totalPaid,
          );

          if (paymentStatus === "PAID") acc.paid.push(invoice);
          else if (isOverdue) acc.overdue.push(invoice);
          else if (paymentStatus === "PARTIALLY_PAID")
            acc.partial.push(invoice);
          else acc.unpaid.push(invoice);

          return acc;
        },
        {
          overdue: [] as typeof filteredInvoices,
          partial: [] as typeof filteredInvoices,
          unpaid: [] as typeof filteredInvoices,
          paid: [] as typeof filteredInvoices,
        },
      ),
    [filteredInvoices, now],
  );

  const handleSelectPeriod = (periodId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("period", periodId);
    setSearchParams(params, { replace: true });
  };

  const groupSum = (
    list: typeof filteredInvoices,
    type: "remaining" | "total",
  ) =>
    list.reduce((sum, invoice) => {
      if (type === "total") return sum + invoice.totalCents;
      const totalPaid = calcPaidSum(invoice.payments);
      return sum + calcRemaining(invoice.totalCents, totalPaid);
    }, 0);

  const partialSummary = useMemo(() => {
    const total = groupSum(groups.partial, "total");
    const remaining = groupSum(groups.partial, "remaining");
    return { total, remaining };
  }, [groups.partial]);

  const renderInvoice = (invoice: (typeof filteredInvoices)[number]) => {
    const totalPaid = calcPaidSum(invoice.payments);
    const remaining = calcRemaining(invoice.totalCents, totalPaid);
    const paymentProgress = calcPaymentStatus(invoice.totalCents, totalPaid);
    const isPaid = paymentProgress === "PAID";
    const isPartiallyPaid = paymentProgress === "PARTIALLY_PAID";

    const handleDeleteInvoice = async () => {
      try {
        await deleteInvoice.mutateAsync(invoice.id);
      } catch (error: unknown) {
        await notify(getApiErrorMessage(t, error), t("common.error"));
      }
    };

    const handleMarkPaidInFull = async () => {
      if (!user || remaining <= 0) return;
      if (periodClosed) {
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
            paidById: user.id,
            amountCents: remaining,
            paidAt: new Date().toISOString(),
          },
        });
      } catch (error: unknown) {
        await notify(getApiErrorMessage(t, error), t("common.error"));
      }
    };

    const status = getInvoiceStatus({
      totalCents: invoice.totalCents,
      totalPaidCents: totalPaid,
      dueDate: invoice.dueDate,
    });

    return (
      <ExpenseItemCard
        key={invoice.id}
        vendor={invoice.vendor}
        description={invoice.description}
        logoUrl={getVendorLogoUrl(vendors, invoice.vendor)}
        amountLabel={fmt(isPartiallyPaid ? remaining : invoice.totalCents)}
        amountDetails={
          isPartiallyPaid
            ? [
                t("invoice.paidOfTotal", {
                  paid: fmt(totalPaid),
                  total: fmt(invoice.totalCents),
                }),
              ]
            : undefined
        }
        typeLabel={distributionLabel(
          invoice.distributionMethod,
          settings.locale,
          invoice.distribution as never,
        )}
        category={invoice.category}
        dateLabel={formatDate(invoice.createdAt)}
        paid={status === "PAID"}
        overdue={status === "OVERDUE"}
        paymentStatus={status}
        amountTone={status === "PARTIALLY_PAID" ? "partial" : "default"}
        showPaidIcon={!isPaid}
        overdueLabel={t("invoice.statusOverdue")}
        onClick={() => navigate(`/invoices/${invoice.id}`)}
        rightContent={
          invoice.isPersonal ? (
            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {t("invoice.personal")}
              </span>
            </div>
          ) : undefined
        }
        actionButton={
          <ActionIconBar
            tight
            stopPropagation
            items={[
              {
                key: "pay",
                icon: CheckCircle2,
                label: t("invoice.registerPayment"),
                onClick: handleMarkPaidInFull,
                disabled:
                  periodClosed || remaining <= 0 || addPayment.isPending,
                hidden: periodClosed,
                colorClassName:
                  "bg-success/20 text-success hover:bg-success/30",
              },
              {
                key: "edit",
                icon: Pencil,
                label: t("common.edit"),
                onClick: () => navigate(`/invoices/${invoice.id}/edit`),
                colorClassName:
                  "bg-violet-500/20 text-violet-500 hover:bg-violet-500/30",
              },
              {
                key: "delete",
                icon: Trash2,
                label: t("common.delete"),
                onClick: handleDeleteInvoice,
                destructive: true,
                confirmMessage: t("invoice.confirmDelete"),
                colorClassName: "bg-danger/20 text-danger hover:bg-danger/30",
              },
            ]}
          />
        }
      />
    );
  };

  const hasAny =
    groups.overdue.length > 0 ||
    groups.partial.length > 0 ||
    groups.unpaid.length > 0 ||
    groups.paid.length > 0;

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t("invoice.invoices")}
        </h1>
        <div className="flex items-center gap-2">
          <AppSelect
            value={selectedPeriodId}
            onChange={(e) => handleSelectPeriod(e.target.value)}
            className={`${CONTROL_HEIGHT} ${SELECT_TRIGGER} w-28 min-w-[7rem] px-3 pr-10 rounded-lg text-sm`}
            wrapperClassName="w-28 min-w-[7rem]"
          >
            {[...periods]
              .sort((a, b) => b.id.localeCompare(a.id))
              .map((period) => (
                <option key={period.id} value={period.id}>
                  {period.id}
                </option>
              ))}
          </AppSelect>
          {selectedPeriod ? (
            <PeriodStatusBadge status={selectedPeriod.status} variant="field" />
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("common.search")}
              className={`w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 ${CONTROL_HEIGHT}`}
            />
          </div>

          <AppSelect
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className={`w-full px-3 text-sm ${CONTROL_HEIGHT}`}
          >
            {methodOptions.map((method) => (
              <option key={method} value={method}>
                {method === "ALL"
                  ? t("invoice.typeFilter")
                  : method === "FIXED_EQUAL"
                    ? t("invoice.equal")
                    : method === "FIXED_AMOUNT"
                      ? t("subscription.fixedAmount")
                      : distributionLabel(method, settings.locale)}
              </option>
            ))}
          </AppSelect>

          <AppSelect
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`w-full px-3 text-sm ${CONTROL_HEIGHT}`}
          >
            <option value="ALL">{t("invoice.categoryFilter")}</option>
            {sortedCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </AppSelect>

          <AppSelect
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
            className={`w-full px-3 text-sm ${CONTROL_HEIGHT}`}
          >
            {statusOptions.map((statusOption) => (
              <option key={statusOption.value} value={statusOption.value}>
                {statusOption.label}
              </option>
            ))}
          </AppSelect>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          disabled={!selectedPeriodId || periodClosed}
          onClick={() => navigate(`/invoices/add?period=${selectedPeriodId}`)}
          icon={<Plus size={15} />}
        >
          {t("invoice.addInvoice")}
        </Button>
      </div>

      {!hasAny ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("common.noData")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.overdue.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-white p-4 shadow-sm dark:border-red-900/50 dark:bg-gray-900 sm:p-5">
              <div className="mb-3">
                <h2 className="text-base font-semibold text-red-700 dark:text-red-400">
                  {t("invoice.statusOverdue")}
                </h2>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {fmt(groupSum(groups.overdue, "remaining"))}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {groups.overdue.map(renderInvoice)}
              </div>
            </div>
          )}

          {groups.partial.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm dark:border-amber-900/50 dark:bg-gray-900 sm:p-5">
              <div className="mb-3">
                <h2 className="text-base font-semibold text-amber-700 dark:text-amber-400">
                  {t("invoice.partialHeader", {
                    remaining: fmt(partialSummary.remaining),
                    total: fmt(partialSummary.total),
                  })}
                </h2>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {fmt(partialSummary.remaining)}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {groups.partial.map(renderInvoice)}
              </div>
            </div>
          )}

          {groups.unpaid.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5">
              <div className="mb-3">
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  {t("invoice.statusUnpaid")}
                </h2>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {fmt(groupSum(groups.unpaid, "total"))}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {groups.unpaid.map(renderInvoice)}
              </div>
            </div>
          )}

          {groups.paid.length > 0 && (
            <div className="rounded-xl border border-green-200 bg-white p-4 shadow-sm dark:border-green-900/50 dark:bg-gray-900 sm:p-5">
              <div className="mb-3">
                <h2 className="text-base font-semibold text-green-700 dark:text-green-400">
                  {t("invoice.statusPaid")}
                </h2>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {fmt(groupSum(groups.paid, "total"))}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {groups.paid.map(renderInvoice)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
