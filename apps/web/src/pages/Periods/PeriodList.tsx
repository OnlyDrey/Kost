import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Lock, AlertCircle, X, Trash2, BarChart3, Pencil, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  usePeriods,
  useCreatePeriod,
  useClosePeriod,
  useDeletePeriod,
  useGetPeriodDeletionInfo,
} from "../../hooks/useApi";
import { useAuth } from "../../stores/auth.context";
import { formatDate } from "../../utils/date";
import ActionIconBar from "../../components/Common/ActionIconBar";
import { isPeriodClosed } from "../../utils/periodStatus";

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm";

export default function PeriodList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const canManageOpenPeriod = isAdmin || user?.role === "ADULT";

  const { data: periods, isLoading } = usePeriods();
  const createPeriod = useCreatePeriod();
  const closePeriod = useClosePeriod();
  const deletePeriod = useDeletePeriod();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [periodId, setPeriodId] = useState("");
  const [error, setError] = useState("");
  const [autoImportSubscriptions, setAutoImportSubscriptions] = useState(true);
  const [deletionModalOpen, setDeletionModalOpen] = useState(false);
  const [deletionPeriodId, setDeletionPeriodId] = useState("");
  const [deletionPassword, setDeletionPassword] = useState("");
  const [deletionError, setDeletionError] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const { data: deletionInfo } = useGetPeriodDeletionInfo(
    deletionModalOpen ? deletionPeriodId : "",
  );

  const years = useMemo(() => {
    if (!periods) return [];
    return Array.from(new Set(periods.map((period) => period.id.split("-")[0]))).sort(
      (a, b) => b.localeCompare(a),
    );
  }, [periods]);

  const months = useMemo(() => {
    if (!periods) return [];
    const source =
      selectedYear === "all"
        ? periods
        : periods.filter((period) => period.id.startsWith(`${selectedYear}-`));
    return Array.from(new Set(source.map((period) => period.id.split("-")[1]))).sort(
      (a, b) => b.localeCompare(a),
    );
  }, [periods, selectedYear]);

  const filteredPeriods = useMemo(() => {
    if (!periods) return [];
    return periods
      .filter((period) => {
        if (selectedYear !== "all" && !period.id.startsWith(`${selectedYear}-`)) {
          return false;
        }
        if (selectedMonth !== "all" && !period.id.endsWith(`-${selectedMonth}`)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [periods, selectedYear, selectedMonth]);

  // Calculate next period suggestion
  const getNextPeriodSuggestion = () => {
    if (!periods || periods.length === 0) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }
    const sorted = [...periods].sort((a, b) => b.id.localeCompare(a.id));
    const latest = sorted[0].id;
    const [year, month] = latest.split("-").map(Number);
    const next = new Date(year, month); // month is 0-indexed, so this gives us the next month
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
  };

  const handleOpenDialog = () => {
    setPeriodId(getNextPeriodSuggestion());
    setError("");
    setAutoImportSubscriptions(true);
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    setError("");
    if (!periodId.trim()) {
      setError(t("validation.required"));
      return;
    }
    if (!/^\d{4}-\d{2}$/.test(periodId.trim())) {
      setError(t("period.invalidIdFormat"));
      return;
    }
    try {
      await createPeriod.mutateAsync({
        id: periodId.trim(),
        autoImportSubscriptions,
      });
      setDialogOpen(false);
      setPeriodId("");
      setAutoImportSubscriptions(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(
        Array.isArray(msg) ? msg.join(", ") : msg || t("errors.serverError"),
      );
    }
  };

  const handleClose = async (id: string) => {
    try {
      await closePeriod.mutateAsync(id);
    } catch {
      alert(t("errors.serverError"));
    }
  };

  const handleOpenDeletionModal = (id: string) => {
    setDeletionPeriodId(id);
    setDeletionPassword("");
    setDeletionError("");
    setDeletionModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeletionError("");
    if (!deletionPassword.trim()) {
      setDeletionError(t("period.passwordRequired"));
      return;
    }
    try {
      await deletePeriod.mutateAsync(deletionPeriodId);
      setDeletionModalOpen(false);
      setDeletionPassword("");
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setDeletionError(
        Array.isArray(msg) ? msg.join(", ") : msg || t("errors.serverError"),
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t("period.periods")}
        </h1>
        {isAdmin && (
          <button
            onClick={handleOpenDialog}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            {t("period.createPeriod")}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setSelectedMonth("all");
            }}
            className="px-3 py-2 pr-7 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
          >
            <option value="all">{t("overview.allYears")}</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 pr-7 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
          >
            <option value="all">{t("overview.allMonths")}</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
      </div>

      {!periods || periods.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("common.noData")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          {filteredPeriods.map((period) => (
            <div
              key={period.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm"
            >
              {(() => {
                const closed = isPeriodClosed(period);

                return (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {period.id}
                          </p>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              !closed
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {!closed ? t("period.open") : t("period.closed")}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 w-full mt-2">
                          {t("period.createdAt", {
                            date: formatDate(period.createdAt),
                          })}
                        </div>
                        {period.closedAt && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {t("period.closedAt", {
                              date: formatDate(period.closedAt),
                            })}
                          </div>
                        )}
                      </div>

                      <ActionIconBar
                        tight
                        items={[
                          {
                            key: "stats",
                            icon: BarChart3,
                            label: t("period.stats"),
                            onClick: () => navigate(`/overview?period=${period.id}`),
                          },
                          {
                            key: "close",
                            icon: Lock,
                            label: t("period.closePeriod"),
                            onClick: () => handleClose(period.id),
                            colorClassName:
                              "bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50",
                            hidden: closed || !canManageOpenPeriod,
                            destructive: true,
                            confirmMessage: t("period.confirmClose"),
                          },
                          {
                            key: "edit",
                            icon: Pencil,
                            label: t("common.edit"),
                            onClick: () => navigate(`/periods/${period.id}`),
                            colorClassName:
                              "bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50",
                            hidden: !closed || !isAdmin,
                          },
                          {
                            key: "delete",
                            icon: Trash2,
                            label: t("common.delete"),
                            onClick: () => handleOpenDeletionModal(period.id),
                            colorClassName:
                              "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50",
                            hidden: !isAdmin,
                            disabled: deletePeriod.isPending,
                          },
                        ]}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {/* Create period modal */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                {t("period.createPeriod")}
              </h2>
              <button
                onClick={() => setDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t("period.periodIdLabel")}
                </label>
                <input
                  type="text"
                  value={periodId}
                  onChange={(e) => setPeriodId(e.target.value)}
                  className={inputCls}
                  placeholder={t("period.periodIdPlaceholder")}
                  maxLength={7}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t("period.periodIdHint")}
                </p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <input
                  id="autoImportSubscriptions"
                  type="checkbox"
                  checked={autoImportSubscriptions}
                  onChange={(e) => setAutoImportSubscriptions(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                />
                <label
                  htmlFor="autoImportSubscriptions"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  {t("period.autoImportSubscriptions")}
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setDialogOpen(false)}
                className="text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleCreate}
                disabled={createPeriod.isPending}
                className="flex items-center gap-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {createPeriod.isPending && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {t("common.add")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete period modal with confirmation */}
      {deletionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <AlertCircle
                  size={18}
                  className="text-red-600 dark:text-red-400"
                />
                {t("period.deletePeriodTitle")}
              </h2>
              <button
                onClick={() => setDeletionModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {deletionError && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>{deletionError}</span>
                </div>
              )}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {t("period.title")}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                    {deletionPeriodId}
                  </p>
                </div>
                {deletionInfo && (
                  <>
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {t("period.invoicesToDelete")}
                      </p>
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400 mt-0.5">
                        {deletionInfo.invoiceCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {t("period.incomesToDelete")}
                      </p>
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400 mt-0.5">
                        {deletionInfo.incomeCount}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t("period.enterPasswordToDelete")}
                </label>
                <input
                  type="password"
                  value={deletionPassword}
                  onChange={(e) => setDeletionPassword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleConfirmDelete()}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder={t("period.passwordPlaceholder")}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setDeletionModalOpen(false)}
                className="text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletePeriod.isPending || !deletionPassword}
                className="flex items-center gap-2 text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {deletePeriod.isPending && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
