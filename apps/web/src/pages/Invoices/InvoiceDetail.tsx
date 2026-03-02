import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  AlertCircle,
  Save,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useInvoice,
  useDeleteInvoice,
  useAddPayment,
  useCurrency,
  useUpdatePayment,
  useDeletePayment,
  useUsers,
  useCurrencyFormatter,
  useVendors,
} from "../../hooks/useApi";
import { useAuth } from "../../stores/auth.context";
import { amountToCents, getCurrencySymbol } from "../../utils/currency";
import { formatDate } from "../../utils/date";
import AllocationExplanation from "../../components/Invoice/AllocationExplanation";
import { distributionLabel } from "../../utils/distribution";
import { useSettings } from "../../stores/settings.context";
import UserSharesGrid from "../../components/Invoice/UserSharesGrid";
import ActionIconBar from "../../components/Common/ActionIconBar";
import TagPill from "../../components/Common/TagPill";
import { useConfirmDialog } from "../../components/Common/ConfirmDialogProvider";

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm";
const dateInputCls = `${inputCls} min-w-0 max-w-full box-border`;

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const canManagePayments = user?.role === "ADMIN";
  const { confirm, notify } = useConfirmDialog();

  const { data: invoice, isLoading } = useInvoice(id!);
  const { data: currency = "NOK" } = useCurrency();
  const currencySymbol = getCurrencySymbol(currency);
  const { data: vendors = [] } = useVendors();
  const fmt = useCurrencyFormatter();
  const deleteInvoice = useDeleteInvoice();
  const addPayment = useAddPayment();
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();
  const { data: users = [] } = useUsers();

  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [payError, setPayError] = useState("");
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editPaidAt, setEditPaidAt] = useState("");
  const [editPaidById, setEditPaidById] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editError, setEditError] = useState("");

  const handleDelete = async () => {
    const accepted = await confirm({
      title: t("common.delete"),
      message: t("invoice.confirmDelete"),
      tone: "danger",
    });

    if (!accepted) return;

    await deleteInvoice.mutateAsync(id!);
    navigate("/invoices");
  };

  const startEditPayment = (payment: any) => {
    setEditingPaymentId(payment.id);
    setEditAmount(String(payment.amountCents / 100));
    setEditPaidAt(
      payment.paidAt ? new Date(payment.paidAt).toISOString().slice(0, 10) : "",
    );
    setEditPaidById(payment.paidById);
    setEditNote(payment.note || "");
    setEditError("");
  };

  const handleSavePayment = async (paymentId: string) => {
    setEditError("");
    const amountCents = amountToCents(parseFloat(editAmount));
    if (isNaN(amountCents) || amountCents <= 0) {
      setEditError(t("validation.invalidAmount"));
      return;
    }
    try {
      await updatePayment.mutateAsync({
        paymentId,
        data: {
          amountCents,
          paidById: editPaidById || undefined,
          paidAt: editPaidAt ? new Date(editPaidAt).toISOString() : undefined,
          note: editNote || undefined,
        },
      });
      setEditingPaymentId(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setEditError(
        Array.isArray(msg) ? msg.join(", ") : msg || t("errors.serverError"),
      );
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    await deletePayment.mutateAsync({ paymentId, invoiceId: id! });
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError("");
    const amountCents = amountToCents(parseFloat(payAmount));
    if (isNaN(amountCents) || amountCents <= 0) {
      setPayError(t("validation.invalidAmount"));
      return;
    }

    try {
      await addPayment.mutateAsync({
        invoiceId: id!,
        data: { paidById: user!.id, amountCents, note: payNote || undefined },
      });
      setShowPayForm(false);
      setPayAmount("");
      setPayNote("");
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setPayError(
        Array.isArray(msg) ? msg.join(", ") : msg || t("errors.serverError"),
      );
    }
  };

  const handleMarkFullyPaid = async () => {
    if (!user || remaining <= 0) return;
    try {
      await addPayment.mutateAsync({
        invoiceId: id!,
        data: {
          paidById: user.id,
          amountCents: remaining,
          note: undefined,
        },
      });
    } catch {
      await notify(t("errors.serverError"), t("common.error"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("errors.notFound")}
      </p>
    );
  }

  const totalPaid = (invoice.payments ?? []).reduce(
    (sum, p) => sum + p.amountCents,
    0,
  );
  const remaining = invoice.totalCents - totalPaid;
  const isPaid = remaining <= 0;
  const vendorLogo = vendors.find(
    (v) => v.name.toLowerCase() === invoice.vendor.toLowerCase(),
  )?.logoUrl;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/invoices")}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t("invoice.title")}
          </h1>
          {invoice.isPersonal && (
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              {t("invoice.personal")}
            </span>
          )}
        </div>
        <ActionIconBar
          tight
          items={[
            {
              key: "mark-complete",
              icon: CheckCircle2,
              label: t("invoice.markComplete"),
              onClick: handleMarkFullyPaid,
              disabled: isPaid || addPayment.isPending,
              colorClassName: "bg-success/20 text-success hover:bg-success/30",
            },
            {
              key: "edit",
              icon: Pencil,
              label: t("common.edit"),
              onClick: () => navigate(`/invoices/${id}/edit`),
              colorClassName: "bg-primary/20 text-primary hover:bg-primary/30",
            },
            {
              key: "delete",
              icon: Trash2,
              label: t("common.delete"),
              onClick: handleDelete,
              colorClassName: "bg-danger/20 text-danger hover:bg-danger/30",
            },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main info */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-3">
          <div
            className="grid gap-3 items-start"
            style={{ gridTemplateColumns: "auto minmax(0, 1fr)" }}
          >
            {vendorLogo ? (
              <img
                src={vendorLogo}
                alt=""
                className="w-11 h-11 rounded-lg object-contain object-center bg-white border border-gray-200 dark:border-gray-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-11 h-11 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
            )}
            <div className="min-w-0">
              <p
                className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-tight line-clamp-2"
                style={{ overflowWrap: "break-word", wordBreak: "normal" }}
              >
                {invoice.vendor}
              </p>
              <p
                className="text-sm text-gray-500 dark:text-gray-300 mt-1"
                style={{ overflowWrap: "break-word", wordBreak: "normal" }}
              >
                {invoice.description || "—"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <TagPill
              label={distributionLabel(
                invoice.distributionMethod,
                settings.locale,
                invoice.distribution as any,
              )}
              variant="type"
            />
            {invoice.category && (
              <TagPill label={invoice.category} variant="category" />
            )}
            {isPaid && (
              <TagPill label={t("invoice.statusPaid")} variant="success" />
            )}
          </div>

          <div className="pt-1">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
              <p className="text-2xl sm:text-[2rem] font-bold text-primary leading-none m-0">
                {fmt(invoice.totalCents)}
              </p>
              <div className="min-w-0 text-right leading-tight">
                <p className="text-sm text-app-text-secondary truncate">
                  {formatDate(invoice.createdAt)}
                </p>
                <p className="text-sm font-medium text-app-text-primary truncate">
                  {invoice.paymentMethod || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Allocation explanation */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {t("invoice.allocationExplanation")}
          </h3>
          <AllocationExplanation invoice={invoice} />
        </div>

        {/* Shares */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t("invoice.shares")}
          </h3>
          <UserSharesGrid
            shares={invoice.shares ?? []}
            totalCents={invoice.totalCents}
            currency={currency}
            emptyLabel={t("common.noData")}
            unknownLabel={t("invoice.unknown")}
          />
        </div>

        {/* Payments */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {t("invoice.payments")}
            </h3>
            {!isPaid && !showPayForm && (
              <button
                onClick={() => {
                  setShowPayForm(true);
                  setPayAmount(String(remaining / 100));
                }}
                className="text-sm font-medium text-indigo-500 dark:text-indigo-400 hover:underline"
              >
                {t("invoice.markComplete")}
              </button>
            )}
          </div>

          {/* Existing payments */}
          {invoice.payments && invoice.payments.length > 0 ? (
            <div className="space-y-2 mb-4">
              {invoice.payments.map((payment) => {
                const isEditing =
                  canManagePayments && editingPaymentId === payment.id;
                return (
                  <div
                    key={payment.id}
                    className="text-sm border border-gray-100 dark:border-gray-800 rounded-lg px-3 py-2 space-y-2"
                  >
                    {isEditing ? (
                      <>
                        {editError && (
                          <p className="text-xs text-red-500">{editError}</p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="min-w-0">
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className={`${inputCls} text-right`}
                            />
                          </div>
                          <div className="min-w-0">
                            <input
                              type="date"
                              value={editPaidAt}
                              onChange={(e) => setEditPaidAt(e.target.value)}
                              className={dateInputCls}
                            />
                          </div>
                          <select
                            value={editPaidById}
                            onChange={(e) => setEditPaidById(e.target.value)}
                            className={inputCls}
                          >
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            className={inputCls}
                            placeholder={t("invoice.noteOptional")}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingPaymentId(null)}
                            className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700"
                          >
                            {t("common.cancel")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSavePayment(payment.id)}
                            className="px-2 py-1 text-xs rounded bg-indigo-500 text-white inline-flex items-center gap-1"
                          >
                            <Save size={12} />
                            {t("common.save")}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {payment.paidBy?.name ?? t("invoice.unknown")}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(payment.paidAt)}
                            {payment.note ? ` · ${payment.note}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-green-500 dark:text-green-400">
                            {fmt(payment.amountCents)}
                          </p>
                          <ActionIconBar
                            tight
                            items={[
                              {
                                key: "edit",
                                icon: Pencil,
                                label: t("common.edit"),
                                onClick: () => startEditPayment(payment),
                                hidden: !canManagePayments,
                                colorClassName:
                                  "bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-500 dark:text-indigo-400",
                              },
                              {
                                key: "delete",
                                icon: Trash2,
                                label: t("common.delete"),
                                onClick: () => handleDeletePayment(payment.id),
                                hidden: !canManagePayments,
                                destructive: true,
                                confirmMessage: t("invoice.confirmDelete"),
                                colorClassName:
                                  "bg-danger/20 hover:bg-danger/30 text-danger",
                              },
                            ]}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : !showPayForm ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("invoice.noPayments")}
            </p>
          ) : null}

          {/* Add payment form */}
          {showPayForm && (
            <form
              onSubmit={handleAddPayment}
              className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4"
            >
              {payError && (
                <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-xs">
                  <AlertCircle size={13} /> <span>{payError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {t("invoice.amountInCurrency", { currency: currencySymbol })}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className={inputCls}
                  required
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {t("invoice.noteOptional")}
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className={inputCls}
                  placeholder={t("invoice.notePlaceholder")}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPayForm(false)}
                  className="flex-1 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={addPayment.isPending}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-semibold bg-green-500 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg transition-colors"
                >
                  {addPayment.isPending && (
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {t("invoice.markComplete")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
