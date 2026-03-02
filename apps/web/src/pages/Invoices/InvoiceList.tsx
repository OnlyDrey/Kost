import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Pencil,
  CheckCircle2,
  Clock,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AppSelect from "../../components/Common/AppSelect";
import {
  useInvoices,
  useCurrentPeriod,
  useCurrency,
  useVendors,
  useDeleteInvoice,
  useAddPayment,
  useCurrencyFormatter,
} from "../../hooks/useApi";
import { formatDate } from "../../utils/date";
import {
  distributionLabel,
  distributionFilterMatch,
} from "../../utils/distribution";
import { useSettings } from "../../stores/settings.context";
import { useAuth } from "../../stores/auth.context";
import ExpenseItemCard from "../../components/Expense/ExpenseItemCard";
import ActionIconBar from "../../components/Common/ActionIconBar";
import { useConfirmDialog } from "../../components/Common/ConfirmDialogProvider";
import { isPeriodClosed } from "../../utils/periodStatus";

const METHOD_OPTIONS = [
  "ALL",
  "BY_INCOME",
  "BY_PERCENT",
  "FIXED_EQUAL",
  "FIXED_AMOUNT",
];
const STATUS_OPTIONS = [
  "ALL",
  "PAID",
  "PARTIALLY_PAID",
  "UNPAID",
  "OVERDUE",
] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

export default function InvoiceList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { user } = useAuth();
  const { notify } = useConfirmDialog();

  const STATUS_LABELS: Record<StatusFilter, string> = {
    ALL: t("invoice.statusAll"),
    PAID: t("invoice.statusPaid"),
    PARTIALLY_PAID: t("invoice.statusPartiallyPaid"),
    UNPAID: t("invoice.statusUnpaid"),
    OVERDUE: t("invoice.statusOverdue"),
  };

  const { data: currentPeriod } = useCurrentPeriod();
  const { data: invoices, isLoading } = useInvoices(currentPeriod?.id);
  const { data: currency = "NOK" } = useCurrency();
  const fmt = useCurrencyFormatter();
  const { data: vendors = [] } = useVendors();
  const deleteInvoice = useDeleteInvoice();
  const addPayment = useAddPayment();
  const periodClosed = currentPeriod ? isPeriodClosed(currentPeriod) : false;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMethod, setFilterMethod] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");

  const categories = Array.from(
    new Set(
      (invoices ?? []).map((invoice) => invoice.category).filter(Boolean),
    ),
  );

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
    [categories],
  );

  const filteredInvoices = invoices?.filter((invoice) => {
    const searchText =
      `${invoice.vendor} ${invoice.description || ""} ${invoice.category}`.toLowerCase();
    const matchesSearch = searchText.includes(searchQuery.toLowerCase());
    const matchesMethod = distributionFilterMatch(
      invoice.distributionMethod,
      filterMethod,
      invoice.distribution as any,
    );
    const matchesCategory =
      filterCategory === "ALL" || invoice.category === filterCategory;

    const totalPaid = (invoice.payments ?? []).reduce(
      (s, p) => s + p.amountCents,
      0,
    );
    const remaining = invoice.totalCents - totalPaid;
    const dueAt = invoice.dueDate ? new Date(invoice.dueDate) : null;
    const overdue = remaining > 0 && !!dueAt && dueAt < new Date();

    let matchesStatus = true;
    if (filterStatus !== "ALL") {
      if (filterStatus === "PAID") matchesStatus = remaining <= 0;
      else if (filterStatus === "PARTIALLY_PAID")
        matchesStatus = totalPaid > 0 && remaining > 0;
      else if (filterStatus === "UNPAID")
        matchesStatus = totalPaid === 0 && !overdue;
      else if (filterStatus === "OVERDUE") matchesStatus = overdue;
    }

    return matchesSearch && matchesMethod && matchesStatus && matchesCategory;
  });

  function getVendorLogo(vendorName: string) {
    return vendors.find(
      (v) => v.name.toLowerCase() === vendorName.toLowerCase(),
    )?.logoUrl;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Group invoices into 4 sections: Overdue, Partially Paid, Unpaid, Paid
  const now = new Date();
  const groups = (filteredInvoices ?? []).reduce(
    (acc, invoice) => {
      const totalPaid = (invoice.payments ?? []).reduce(
        (sum, p) => sum + p.amountCents,
        0,
      );
      const remaining = invoice.totalCents - totalPaid;
      const dueAt = invoice.dueDate ? new Date(invoice.dueDate) : null;
      const isOverdue = remaining > 0 && !!dueAt && dueAt < now;
      if (remaining <= 0) acc.paid.push(invoice);
      else if (isOverdue) acc.overdue.push(invoice);
      else if (totalPaid > 0) acc.partial.push(invoice);
      else acc.unpaid.push(invoice);
      return acc;
    },
    {
      overdue: [] as any[],
      partial: [] as any[],
      unpaid: [] as any[],
      paid: [] as any[],
    },
  );

  const groupSum = (list: any[], type: "remaining" | "total") =>
    list.reduce((sum, inv) => {
      if (type === "total") return sum + inv.totalCents;
      const totalPaid = (inv.payments ?? []).reduce(
        (s: number, p: any) => s + p.amountCents,
        0,
      );
      return sum + Math.max(0, inv.totalCents - totalPaid);
    }, 0);

  const renderInvoice = (invoice: any) => {
    const totalPaid = (invoice.payments ?? []).reduce(
      (sum: number, p: any) => sum + p.amountCents,
      0,
    );
    const remaining = invoice.totalCents - totalPaid;
    const isPaid = remaining <= 0;
    const isPartiallyPaid = totalPaid > 0 && !isPaid;
    const dueAt = invoice.dueDate ? new Date(invoice.dueDate) : null;
    const overdue = !isPaid && !!dueAt && dueAt < new Date();
    const logoUrl = getVendorLogo(invoice.vendor);

    const handleDeleteInvoice = async () => {
      try {
        await deleteInvoice.mutateAsync(invoice.id);
      } catch {
        await notify(t("errors.serverError"), t("common.error"));
      }
    };

    const handleMarkPaidInFull = async () => {
      if (!user || remaining <= 0) return;
      if (periodClosed) {
        await notify(t("invoice.closedPeriodPaymentBlocked"), t("common.error"));
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
      } catch {
        await notify(t("errors.serverError"), t("common.error"));
      }
    };

    return (
      <ExpenseItemCard
        key={invoice.id}
        vendor={invoice.vendor}
        description={invoice.description}
        logoUrl={logoUrl}
        amountLabel={fmt(invoice.totalCents)}
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
        showPaidIcon={!isPaid}
        overdueLabel={t("invoice.statusOverdue")}
        onClick={() => navigate(`/invoices/${invoice.id}`)}
        rightContent={
          <div className="flex flex-col items-end gap-1">
            {invoice.isPersonal && (
              <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
                {t("invoice.personal")}
              </span>
            )}
            {isPartiallyPaid && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Clock size={10} />{" "}
                {t("invoice.remaining", { amount: fmt(remaining) })}
              </span>
            )}
          </div>
        }
        actionButton={
          <ActionIconBar
            tight
            stopPropagation
            items={[
              {
                key: "pay",
                icon: CheckCircle2,
                label: t("invoice.markPaid"),
                onClick: handleMarkPaidInFull,
                disabled: periodClosed || remaining <= 0 || addPayment.isPending,
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t("invoice.invoices")}
        </h1>
        <button
          onClick={() => navigate("/invoices/add")}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          {t("invoice.addInvoice")}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("common.search")}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <AppSelect
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {METHOD_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m === "ALL"
                  ? t("invoice.typeFilter")
                  : m === "FIXED_EQUAL"
                    ? t("invoice.equal")
                    : m === "FIXED_AMOUNT"
                      ? t("subscription.fixedAmount")
                      : distributionLabel(m, settings.locale)}
              </option>
            ))}
          </AppSelect>
          <AppSelect
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="ALL">{t("invoice.categoryFilter")}</option>
            {sortedCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </AppSelect>
          <AppSelect
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </AppSelect>
        </div>
      </div>

      {!hasAny ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("common.noData")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.overdue.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-900/50 p-4 sm:p-5 shadow-sm">
              <div className="mb-3">
                <h2 className="text-base font-semibold text-red-700 dark:text-red-400">
                  {t("invoice.statusOverdue")}
                </h2>
                <p className="text-sm font-medium text-red-500 dark:text-red-400/80 mt-0.5">
                  {fmt(groupSum(groups.overdue, "remaining"))}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groups.overdue.map(renderInvoice)}
              </div>
            </div>
          )}

          {groups.partial.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-amber-200 dark:border-amber-900/50 p-4 sm:p-5 shadow-sm">
              <div className="mb-3">
                <h2 className="text-base font-semibold text-amber-700 dark:text-amber-400">
                  {t("invoice.statusPartiallyPaid")}
                </h2>
                <p className="text-sm font-medium text-amber-500 dark:text-amber-400/80 mt-0.5">
                  {fmt(groupSum(groups.partial, "remaining"))}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groups.partial.map(renderInvoice)}
              </div>
            </div>
          )}

          {groups.unpaid.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 shadow-sm">
              <div className="mb-3">
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  {t("invoice.statusUnpaid")}
                </h2>
                <p className="text-sm font-medium text-primary dark:text-primary mt-0.5">
                  {fmt(groupSum(groups.unpaid, "total"))}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groups.unpaid.map(renderInvoice)}
              </div>
            </div>
          )}

          {groups.paid.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-green-200 dark:border-green-900/50 p-4 sm:p-5 shadow-sm">
              <div className="mb-3">
                <h2 className="text-base font-semibold text-green-700 dark:text-green-400">
                  {t("invoice.statusPaid")}
                </h2>
                <p className="text-sm font-medium text-green-500 dark:text-green-400/80 mt-0.5">
                  {fmt(groupSum(groups.paid, "total"))}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groups.paid.map(renderInvoice)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
