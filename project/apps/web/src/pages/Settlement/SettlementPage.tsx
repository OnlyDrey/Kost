import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Clock3,
  Pencil,
  Scale,
  Wallet,
} from "lucide-react";
import AppSelect from "../../components/Common/AppSelect";
import MoneyInput from "../../components/Common/MoneyInput";
import UserPickerSelect from "../../components/Common/UserPickerSelect";
import PeriodStatusBadge from "../../components/Common/PeriodStatusBadge";
import TileGrid from "../../components/Common/TileGrid";
import SettlementSummaryCard from "../../components/Common/SettlementSummaryCard";
import { TabButton, TabsRow } from "../../components/ui/tabs";
import AppDialog from "../../components/Common/AppDialog";
import { Button } from "../../components/ui/button";
import {
  useCreateSettlementEntry,
  useCreateSettlementPlan,
  useCurrency,
  useCurrencyFormatter,
  useCurrencySymbolPosition,
  usePeriods,
  useReverseSettlementEntry,
  useUpdateSettlementEntry,
  useSettlementSummary,
  useUsers,
} from "../../hooks/useApi";
import { useAuth } from "../../stores/auth.context";
import { amountToCents, getCurrencySymbol } from "../../utils/currency";
import {
  CONTROL_HEIGHT,
  SELECT_TRIGGER,
} from "../../components/Common/focusStyles";
import { getApiErrorMessage } from "../../utils/apiErrors";

function safeCents(value: number): number {
  return Math.abs(value) < 1 ? 0 : value;
}

const inputCls = `w-full ${CONTROL_HEIGHT} px-3.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm`;
const dateInputCls = `${inputCls} w-full min-w-0 max-w-full box-border appearance-none`;

type SettlementTab = "overforing" | "oppgjor" | "historikk";

const routeToTab: Record<string, SettlementTab> = {
  overforing: "overforing",
  oppgjor: "oppgjor",
  historikk: "historikk",
};

export default function SettlementPage() {
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const fmt = useCurrencyFormatter();
  const { data: currency = "NOK" } = useCurrency();
  const { data: symbolPosition = "Before" } = useCurrencySymbolPosition();
  const currencySymbol = getCurrencySymbol(currency);

  const { data: periods = [] } = usePeriods();
  const [periodId, setPeriodId] = useState(periods[0]?.id ?? "");
  const { data: users = [] } = useUsers();
  const { data: summary } = useSettlementSummary(periodId);

  const selectedPeriod = periods.find((period) => period.id === periodId);
  const isOpenPeriod = selectedPeriod?.status === "OPEN";

  const createEntry = useCreateSettlementEntry();
  const createPlan = useCreateSettlementPlan();
  const reverseEntry = useReverseSettlementEntry();
  const updateEntry = useUpdateSettlementEntry();

  const activeTab = tab ? routeToTab[tab] : undefined;
  const [entryError, setEntryError] = useState("");
  const [entrySuccess, setEntrySuccess] = useState("");

  const [entryForm, setEntryForm] = useState({
    fromUserId: "",
    toUserId: "",
    amount: "",
    comment: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const [planForm, setPlanForm] = useState({
    fromUserId: "",
    toUserId: "",
    planType: "full_next_period",
    configuredAmount: "",
    configuredPeriods: "",
    comment: "",
  });

  const [transactionDialog, setTransactionDialog] = useState({
    open: false,
    entryId: "",
    mode: "menu" as "menu" | "edit" | "reverse",
    amount: "",
    comment: "",
    error: "",
  });

  const userName = (id: string) =>
    users.find((user) => user.id === id)?.name ?? id;

  const saldoCents = safeCents(
    (summary?.rows ?? []).reduce(
      (sum, row) =>
        sum +
        row.baseObligationCents +
        row.plannedAdditionCents -
        row.carriedCreditCents -
        row.paymentsCents,
      0,
    ),
  );

  const saldoValueClass =
    saldoCents < 0
      ? "text-red-600 dark:text-red-400"
      : saldoCents > 0
        ? "text-green-600 dark:text-green-400"
        : "text-gray-100";

  const monthShareCents = safeCents(
    (summary?.rows ?? []).reduce(
      (sum, row) => sum + row.baseObligationCents,
      0,
    ),
  );

  const sortedHistory = useMemo(
    () =>
      [...(summary?.history ?? [])].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    [summary?.history],
  );

  useEffect(() => {
    if (!activeTab) {
      navigate("/oppgjor/overforing", { replace: true });
    }
  }, [activeTab, navigate]);

  const handleTabChange = (nextTab: SettlementTab) => {
    navigate(`/oppgjor/${nextTab}`);
  };

  if (!activeTab) {
    return null;
  }

  const submitEntry = async () => {
    setEntryError("");
    setEntrySuccess("");

    try {
      await createEntry.mutateAsync({
        periodId,
        fromUserId: entryForm.fromUserId,
        toUserId: entryForm.toUserId,
        amountCents: amountToCents(Number(entryForm.amount || "0")),
        type: "payment",
        comment: entryForm.comment,
        effectiveDate: entryForm.date,
      });
      setEntryForm((prev) => ({ ...prev, amount: "", comment: "" }));
      setEntrySuccess(t("settlement.paymentSaved"));
    } catch (error) {
      setEntryError(getApiErrorMessage(t, error));
    }
  };

  const submitPlan = async () => {
    await createPlan.mutateAsync({
      sourcePeriodId: periodId,
      fromUserId: planForm.fromUserId,
      toUserId: planForm.toUserId,
      planType: planForm.planType as
        | "full_next_period"
        | "fixed_amount_per_period"
        | "fixed_number_of_periods",
      configuredAmountCents:
        planForm.planType === "fixed_amount_per_period" &&
        planForm.configuredAmount
          ? amountToCents(Number(planForm.configuredAmount))
          : undefined,
      configuredPeriodCount:
        planForm.planType === "fixed_number_of_periods" &&
        planForm.configuredPeriods
          ? Number(planForm.configuredPeriods)
          : undefined,
      comment: planForm.comment,
      startPeriodId: periods.find((period) => period.status === "OPEN")?.id,
    });

    setPlanForm((prev) => ({
      ...prev,
      configuredAmount: "",
      configuredPeriods: "",
      comment: "",
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t("settlement.title")}
        </h1>
        <div className="flex items-center gap-2">
          <AppSelect
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
            className={`${CONTROL_HEIGHT} ${SELECT_TRIGGER} w-28 min-w-[7rem] px-3 pr-10 rounded-lg text-sm`}
            wrapperClassName="w-28 min-w-[7rem]"
          >
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.id}
              </option>
            ))}
          </AppSelect>
          {selectedPeriod && (
            <PeriodStatusBadge status={selectedPeriod.status} variant="field" />
          )}
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <TabsRow>
          <TabButton
            active={activeTab === "overforing"}
            icon={<ArrowLeftRight size={16} />}
            onClick={() => handleTabChange("overforing")}
          >
            {t("settlement.tabPayments")}
          </TabButton>
          <TabButton
            active={activeTab === "oppgjor"}
            icon={<Scale size={16} />}
            onClick={() => handleTabChange("oppgjor")}
          >
            {t("settlement.tabSettlement")}
          </TabButton>
          <TabButton
            active={activeTab === "historikk"}
            icon={<Clock3 size={16} />}
            onClick={() => handleTabChange("historikk")}
          >
            {t("settlement.history")}
          </TabButton>
        </TabsRow>
      </div>

      {activeTab === "oppgjor" && (
        <>
          <TileGrid
            gridClassName="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3"
            items={[
              {
                key: "saldo",
                icon: Wallet,
                label: t("settlement.netBalance"),
                value: (
                  <span className={saldoValueClass}>{fmt(saldoCents)}</span>
                ),
                colorClass: "bg-blue-500/20",
                iconTextClass: "text-blue-400",
              },
              {
                key: "paid-period",
                icon: CheckCircle2,
                label: t("settlement.totalPaidPeriod"),
                value: fmt(safeCents(summary?.totals.totalPaidCents ?? 0)),
                colorClass: "bg-green-500/20",
                iconTextClass: "text-green-400",
              },
              {
                key: "share-period",
                icon: Scale,
                label: t("settlement.totalPeriodShare"),
                value: fmt(monthShareCents),
                colorClass: "bg-yellow-500/20",
                iconTextClass: "text-yellow-400",
              },
              {
                key: "warnings",
                icon: AlertTriangle,
                label: t("settlement.unresolvedWarnings"),
                value: String(summary?.totals.unresolvedWarningCount ?? 0),
                colorClass: "bg-orange-500/20",
                iconTextClass: "text-orange-400",
              },
            ]}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Scale size={18} className="text-primary" />
                <h2 className="text-lg font-semibold">
                  {t("settlement.overview")}
                </h2>
              </div>
              {(summary?.rows ?? []).length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("settlement.overviewEmpty")}
                </p>
              ) : (
                <div className="space-y-2">
                  {(summary?.rows ?? []).map((row) => (
                    <SettlementSummaryCard
                      key={`${row.fromUserId}-${row.toUserId}`}
                      direction={`${userName(row.fromUserId)} → ${userName(row.toUserId)}`}
                      amount={fmt(safeCents(row.remainingCents))}
                      remainingLabel={t("settlement.remainingShort")}
                      baseShareLabel={t("settlement.basePeriodShare")}
                      baseShareValue={fmt(safeCents(row.baseObligationCents))}
                      carriedCreditLabel={t("settlement.carriedCredit")}
                      carriedCreditValue={fmt(
                        safeCents(row.carriedCreditCents),
                      )}
                      paymentsLabel={t("settlement.payments")}
                      paymentsValue={fmt(safeCents(row.paymentsCents))}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ArrowLeftRight size={18} className="text-primary" />
                <h3 className="font-semibold">{t("settlement.planTitle")}</h3>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <UserPickerSelect
                    label={t("settlement.fromUser")}
                    value={planForm.fromUserId}
                    users={users}
                    placeholder={t("settlement.fromUser")}
                    onChange={(value) =>
                      setPlanForm((prev) => ({ ...prev, fromUserId: value }))
                    }
                  />
                  <UserPickerSelect
                    label={t("settlement.toUser")}
                    value={planForm.toUserId}
                    users={users}
                    placeholder={t("settlement.toUser")}
                    onChange={(value) =>
                      setPlanForm((prev) => ({ ...prev, toUserId: value }))
                    }
                  />
                </div>

                <AppSelect
                  value={planForm.planType}
                  onChange={(e) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      planType: e.target.value,
                    }))
                  }
                  className={CONTROL_HEIGHT}
                >
                  <option value="full_next_period">
                    {t("settlement.planFullNext")}
                  </option>
                  <option value="fixed_amount_per_period">
                    {t("settlement.planFixedAmount")}
                  </option>
                  <option value="fixed_number_of_periods">
                    {t("settlement.planFixedPeriods")}
                  </option>
                </AppSelect>

                {planForm.planType === "fixed_amount_per_period" && (
                  <MoneyInput
                    value={planForm.configuredAmount}
                    onChange={(e) =>
                      setPlanForm((prev) => ({
                        ...prev,
                        configuredAmount: e.target.value,
                      }))
                    }
                    currencySymbol={currencySymbol}
                    symbolPosition={symbolPosition as "Before" | "After"}
                    placeholder={t("settlement.fixedAmountPerPeriod")}
                  />
                )}

                {planForm.planType === "fixed_number_of_periods" && (
                  <input
                    value={planForm.configuredPeriods}
                    onChange={(e) =>
                      setPlanForm((prev) => ({
                        ...prev,
                        configuredPeriods: e.target.value,
                      }))
                    }
                    className={inputCls}
                    placeholder={t("settlement.numberOfPeriods")}
                  />
                )}

                <input
                  value={planForm.comment}
                  onChange={(e) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  className={inputCls}
                  placeholder={t("settlement.comment")}
                />
              </div>

              <Button
                className="w-full sm:w-auto"
                disabled={
                  !isAdmin ||
                  !periodId ||
                  !planForm.fromUserId ||
                  !planForm.toUserId
                }
                onClick={() => void submitPlan()}
              >
                {t("settlement.createPlan")}
              </Button>
            </section>
          </div>
        </>
      )}

      {activeTab === "overforing" && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={18} className="text-primary" />
            <h3 className="font-semibold">{t("settlement.registerPayment")}</h3>
          </div>
          {!isAdmin && (
            <p className="text-sm text-amber-600">
              {t("settlement.adminOnly")}
            </p>
          )}
          {!isOpenPeriod && (
            <p className="text-sm text-amber-600">
              {t("settlement.closedPeriodPaymentBlocked")}
            </p>
          )}

          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <UserPickerSelect
                label={t("settlement.fromUser")}
                value={entryForm.fromUserId}
                users={users}
                placeholder={t("settlement.fromUser")}
                onChange={(value) =>
                  setEntryForm((prev) => ({ ...prev, fromUserId: value }))
                }
                disabled={!isOpenPeriod}
              />
              <UserPickerSelect
                label={t("settlement.toUser")}
                value={entryForm.toUserId}
                users={users}
                placeholder={t("settlement.toUser")}
                onChange={(value) =>
                  setEntryForm((prev) => ({ ...prev, toUserId: value }))
                }
                disabled={!isOpenPeriod}
              />
            </div>
            <MoneyInput
              value={entryForm.amount}
              onChange={(e) =>
                setEntryForm((prev) => ({ ...prev, amount: e.target.value }))
              }
              currencySymbol={currencySymbol}
              symbolPosition={symbolPosition as "Before" | "After"}
              placeholder={t("settlement.amount")}
              disabled={!isOpenPeriod}
            />
            <input
              type="date"
              value={entryForm.date}
              onChange={(e) =>
                setEntryForm((prev) => ({ ...prev, date: e.target.value }))
              }
              className={dateInputCls}
              disabled={!isOpenPeriod}
            />
            <input
              value={entryForm.comment}
              onChange={(e) =>
                setEntryForm((prev) => ({ ...prev, comment: e.target.value }))
              }
              className={inputCls}
              placeholder={t("settlement.comment")}
              disabled={!isOpenPeriod}
            />
          </div>

          <Button
            className="w-full sm:w-auto"
            disabled={
              createEntry.isPending ||
              !isAdmin ||
              !periodId ||
              !isOpenPeriod ||
              !entryForm.fromUserId ||
              !entryForm.toUserId ||
              !entryForm.date ||
              Number(entryForm.amount) <= 0 ||
              entryForm.fromUserId === entryForm.toUserId
            }
            onClick={() => void submitEntry()}
          >
            {t("settlement.saveEntry")}
          </Button>
          {entryError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {entryError}
            </p>
          )}
          {entrySuccess && (
            <p className="text-sm text-green-600 dark:text-green-400">
              {entrySuccess}
            </p>
          )}
        </section>
      )}

      {activeTab === "historikk" && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Clock3 size={18} className="text-primary" />
            <h3 className="font-semibold">{t("settlement.history")}</h3>
          </div>
          {sortedHistory.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("settlement.historyEmpty")}
            </p>
          ) : (
            <div className="space-y-2">
              {sortedHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">
                        {userName(entry.fromUserId)} →{" "}
                        {userName(entry.toUserId)}
                      </div>
                      <div className="font-semibold">
                        {fmt(safeCents(entry.amountCents))}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(entry.effectiveDate).toLocaleDateString()}
                      </div>
                      {entry.comment && (
                        <div className="mt-1 text-gray-600 dark:text-gray-300">
                          {entry.comment}
                        </div>
                      )}
                      {entry.reversedAt && (
                        <div className="mt-1 text-xs text-red-600">
                          {t("settlement.reversed")}
                        </div>
                      )}
                    </div>

                    {!entry.reversedAt && isAdmin ? (
                      <Button
                        variant="secondary"
                        className="shrink-0"
                        disabled={!isOpenPeriod}
                        icon={<Pencil size={14} />}
                        onClick={() =>
                          setTransactionDialog({
                            open: true,
                            entryId: entry.id,
                            mode: "menu",
                            amount: (entry.amountCents / 100).toFixed(2),
                            comment: entry.comment ?? "",
                            error: "",
                          })
                        }
                      >
                        {t("common.edit")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {(activeTab === "oppgjor" || activeTab === "overforing") &&
        !!summary?.warnings.length && (
          <section className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/10 p-4">
            <h3 className="font-semibold text-amber-800 dark:text-amber-300">
              {t("settlement.unresolvedUnpaid")}
            </h3>
            <ul className="list-disc pl-5 text-sm mt-2 space-y-1 text-amber-900 dark:text-amber-200">
              {summary.warnings.map((warning, idx) => (
                <li key={`${warning.sourcePeriodId}-${idx}`}>
                  {warning.sourcePeriodId}: {userName(warning.fromUserId)} →{" "}
                  {userName(warning.toUserId)} ={" "}
                  {fmt(safeCents(warning.amountCents))}
                </li>
              ))}
            </ul>
          </section>
        )}

      <AppDialog
        open={transactionDialog.open}
        onClose={() =>
          setTransactionDialog({
            open: false,
            entryId: "",
            mode: "menu",
            amount: "",
            comment: "",
            error: "",
          })
        }
        title={
          transactionDialog.mode === "menu"
            ? t("settlement.history")
            : transactionDialog.mode === "edit"
              ? t("common.edit")
              : t("settlement.reverseAction")
        }
        size="sm"
        footer={
          transactionDialog.mode === "menu" ? null : (
            <div className="grid w-full grid-cols-2 gap-2">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() =>
                  setTransactionDialog((prev) => ({
                    ...prev,
                    mode: "menu",
                    error: "",
                  }))
                }
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="w-full"
                onClick={() => {
                  if (transactionDialog.mode === "edit") {
                    const normalized = transactionDialog.amount
                      .replace(",", ".")
                      .trim();
                    const amount = Number(normalized);
                    if (!Number.isFinite(amount) || amount <= 0) {
                      setTransactionDialog((prev) => ({
                        ...prev,
                        error: t("settlement.invalidAmount"),
                      }));
                      return;
                    }

                    void updateEntry
                      .mutateAsync({
                        periodId,
                        entryId: transactionDialog.entryId,
                        amountCents: amountToCents(amount),
                        comment: transactionDialog.comment || undefined,
                      })
                      .then(() =>
                        setTransactionDialog({
                          open: false,
                          entryId: "",
                          mode: "menu",
                          amount: "",
                          comment: "",
                          error: "",
                        }),
                      )
                      .catch((error: unknown) =>
                        setTransactionDialog((prev) => ({
                          ...prev,
                          error: getApiErrorMessage(t, error),
                        })),
                      );
                    return;
                  }

                  if (!transactionDialog.comment.trim()) {
                    setTransactionDialog((prev) => ({
                      ...prev,
                      error: t("common.required"),
                    }));
                    return;
                  }

                  void reverseEntry
                    .mutateAsync({
                      periodId,
                      entryId: transactionDialog.entryId,
                      comment: transactionDialog.comment.trim(),
                    })
                    .then(() =>
                      setTransactionDialog({
                        open: false,
                        entryId: "",
                        mode: "menu",
                        amount: "",
                        comment: "",
                        error: "",
                      }),
                    )
                    .catch((error: unknown) =>
                      setTransactionDialog((prev) => ({
                        ...prev,
                        error: getApiErrorMessage(t, error),
                      })),
                    );
                }}
              >
                {transactionDialog.mode === "edit"
                  ? t("common.save")
                  : t("settlement.reverseAction")}
              </Button>
            </div>
          )
        }
      >
        {transactionDialog.mode === "menu" ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() =>
                setTransactionDialog((prev) => ({
                  ...prev,
                  mode: "edit",
                  error: "",
                }))
              }
            >
              {t("common.edit")} {t("settlement.amount").toLowerCase()}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() =>
                setTransactionDialog((prev) => ({
                  ...prev,
                  mode: "reverse",
                  error: "",
                }))
              }
            >
              {t("settlement.reverseAction")}
            </Button>
          </div>
        ) : transactionDialog.mode === "edit" ? (
          <div className="space-y-2">
            <MoneyInput
              value={transactionDialog.amount}
              onChange={(e) =>
                setTransactionDialog((prev) => ({
                  ...prev,
                  amount: e.target.value,
                  error: "",
                }))
              }
              currencySymbol={currencySymbol}
              symbolPosition={symbolPosition as "Before" | "After"}
              placeholder={t("settlement.amount")}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(() => {
                const normalized = transactionDialog.amount.replace(",", ".").trim();
                const value = Number(normalized || "0");
                return fmt(amountToCents(Number.isFinite(value) ? value : 0));
              })()}
            </p>
            <textarea
              value={transactionDialog.comment}
              onChange={(e) =>
                setTransactionDialog((prev) => ({
                  ...prev,
                  comment: e.target.value,
                  error: "",
                }))
              }
              className="w-full min-h-24 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              placeholder={t("settlement.comment")}
            />
          </div>
        ) : (
          <textarea
            value={transactionDialog.comment}
            onChange={(e) =>
              setTransactionDialog((prev) => ({
                ...prev,
                comment: e.target.value,
                error: "",
              }))
            }
            className="w-full min-h-24 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            placeholder={t("settlement.reversalCommentPrompt")}
          />
        )}
        {transactionDialog.error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {transactionDialog.error}
          </p>
        )}
      </AppDialog>
    </div>
  );
}
