import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Clock3,
  MinusCircle,
  Scale,
  Wallet,
} from "lucide-react";
import AppSelect from "../../components/Common/AppSelect";
import PeriodStatusBadge from "../../components/Common/PeriodStatusBadge";
import StatWidget from "../../components/Common/StatWidget";
import SettlementSummaryCard from "../../components/Common/SettlementSummaryCard";
import { TabButton, TabsRow } from "../../components/ui/tabs";
import AppDialog from "../../components/Common/AppDialog";
import { Button } from "../../components/ui/button";
import {
  useCreateSettlementEntry,
  useCreateSettlementPlan,
  useCurrencyFormatter,
  usePeriods,
  useReverseSettlementEntry,
  useSettlementSummary,
  useUsers,
} from "../../hooks/useApi";
import { useAuth } from "../../stores/auth.context";
import { amountToCents } from "../../utils/currency";
import { CONTROL_HEIGHT } from "../../components/Common/focusStyles";
import { getApiErrorMessage } from "../../utils/apiErrors";

function safeCents(value: number): number {
  return Math.abs(value) < 1 ? 0 : value;
}

const inputCls = `w-full ${CONTROL_HEIGHT} px-3.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm`;
const dateInputCls = `${inputCls} w-full min-w-0 max-w-full box-border appearance-none`;

type SettlementTab = "payments" | "settlement" | "history";

export default function SettlementPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const fmt = useCurrencyFormatter();

  const { data: periods = [] } = usePeriods();
  const [periodId, setPeriodId] = useState(periods[0]?.id ?? "");
  const { data: users = [] } = useUsers();
  const { data: summary } = useSettlementSummary(periodId);

  const selectedPeriod = periods.find((period) => period.id === periodId);
  const isOpenPeriod = selectedPeriod?.status === "OPEN";

  const createEntry = useCreateSettlementEntry();
  const createPlan = useCreateSettlementPlan();
  const reverseEntry = useReverseSettlementEntry();

  const [activeTab, setActiveTab] = useState<SettlementTab>("settlement");
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

  const [reverseDialog, setReverseDialog] = useState({
    open: false,
    entryId: "",
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
            className="h-10 px-3 pr-10 rounded-lg text-sm w-36"
            wrapperClassName="w-36"
          >
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.id}
              </option>
            ))}
          </AppSelect>
          {selectedPeriod && (
            <PeriodStatusBadge status={selectedPeriod.status} size="sm" />
          )}
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <TabsRow>
          <TabButton
            active={activeTab === "payments"}
            icon={<ArrowLeftRight size={16} />}
            onClick={() => setActiveTab("payments")}
          >
            {t("settlement.tabPayments")}
          </TabButton>
          <TabButton
            active={activeTab === "settlement"}
            icon={<Scale size={16} />}
            onClick={() => setActiveTab("settlement")}
          >
            {t("settlement.tabSettlement")}
          </TabButton>
          <TabButton
            active={activeTab === "history"}
            icon={<Clock3 size={16} />}
            onClick={() => setActiveTab("history")}
          >
            {t("settlement.history")}
          </TabButton>
        </TabsRow>
      </div>

      {activeTab === "settlement" && (
        <>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <StatWidget
              icon={Wallet}
              title={t("settlement.netBalance")}
              value={
                <span className={saldoValueClass}>
                  {saldoCents < 0 && (
                    <MinusCircle className="inline-block w-4 h-4 mr-1 align-text-bottom" />
                  )}
                  {fmt(saldoCents)}
                </span>
              }
              colorClass={
                saldoCents < 0
                  ? "bg-red-500"
                  : saldoCents > 0
                    ? "bg-green-500"
                    : "bg-slate-500"
              }
            />
            <StatWidget
              icon={CheckCircle2}
              title={t("settlement.totalPaidPeriod")}
              value={fmt(safeCents(summary?.totals.totalPaidCents ?? 0))}
              colorClass="bg-green-500"
            />
            <StatWidget
              icon={Scale}
              title={t("settlement.totalPeriodShare")}
              value={fmt(monthShareCents)}
              colorClass="bg-amber-500"
            />
            <StatWidget
              icon={AlertTriangle}
              title={t("settlement.unresolvedWarnings")}
              value={String(summary?.totals.unresolvedWarningCount ?? 0)}
              colorClass="bg-orange-500"
            />
          </div>

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
                      remainingLabel={t("settlement.remaining")}
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
                <div className="grid grid-cols-2 gap-2">
                  <AppSelect
                    value={planForm.fromUserId}
                    onChange={(e) =>
                      setPlanForm((prev) => ({
                        ...prev,
                        fromUserId: e.target.value,
                      }))
                    }
                    className="h-10"
                  >
                    <option value="">{t("settlement.fromUser")}</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </AppSelect>

                  <AppSelect
                    value={planForm.toUserId}
                    onChange={(e) =>
                      setPlanForm((prev) => ({
                        ...prev,
                        toUserId: e.target.value,
                      }))
                    }
                    className="h-10"
                  >
                    <option value="">{t("settlement.toUser")}</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </AppSelect>
                </div>

                <AppSelect
                  value={planForm.planType}
                  onChange={(e) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      planType: e.target.value,
                    }))
                  }
                  className="h-10"
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
                  <input
                    value={planForm.configuredAmount}
                    onChange={(e) =>
                      setPlanForm((prev) => ({
                        ...prev,
                        configuredAmount: e.target.value,
                      }))
                    }
                    className={inputCls}
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

      {activeTab === "payments" && (
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
            <div className="grid grid-cols-2 gap-2">
              <AppSelect
                value={entryForm.fromUserId}
                onChange={(e) =>
                  setEntryForm((prev) => ({
                    ...prev,
                    fromUserId: e.target.value,
                  }))
                }
                className="h-10"
                disabled={!isOpenPeriod}
              >
                <option value="">{t("settlement.fromUser")}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </AppSelect>
              <AppSelect
                value={entryForm.toUserId}
                onChange={(e) =>
                  setEntryForm((prev) => ({
                    ...prev,
                    toUserId: e.target.value,
                  }))
                }
                className="h-10"
                disabled={!isOpenPeriod}
              >
                <option value="">{t("settlement.toUser")}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </AppSelect>
            </div>
            <input
              value={entryForm.amount}
              onChange={(e) =>
                setEntryForm((prev) => ({ ...prev, amount: e.target.value }))
              }
              className={inputCls}
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

      {activeTab === "history" && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-2">
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
                  className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-sm"
                >
                  <div className="font-medium">
                    {userName(entry.fromUserId)} → {userName(entry.toUserId)}
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
                    <div className="text-xs text-red-600 mt-1">
                      {t("settlement.reversed")}
                    </div>
                  )}
                  {!entry.reversedAt && isAdmin && (
                    <Button
                      variant="secondary"
                      className="mt-2 rounded-full px-4"
                      disabled={!isOpenPeriod}
                      onClick={() =>
                        setReverseDialog({
                          open: true,
                          entryId: entry.id,
                          comment: "",
                          error: "",
                        })
                      }
                    >
                      {t("settlement.reverseAction")}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {(activeTab === "settlement" || activeTab === "payments") &&
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
        open={reverseDialog.open}
        onClose={() =>
          setReverseDialog({ open: false, entryId: "", comment: "", error: "" })
        }
        title={t("settlement.reversalCommentPrompt")}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                setReverseDialog({
                  open: false,
                  entryId: "",
                  comment: "",
                  error: "",
                })
              }
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (!reverseDialog.comment.trim()) {
                  setReverseDialog((prev) => ({
                    ...prev,
                    error: t("common.required"),
                  }));
                  return;
                }

                void reverseEntry
                  .mutateAsync({
                    periodId,
                    entryId: reverseDialog.entryId,
                    comment: reverseDialog.comment.trim(),
                  })
                  .then(() =>
                    setReverseDialog({
                      open: false,
                      entryId: "",
                      comment: "",
                      error: "",
                    }),
                  );
              }}
            >
              {t("settlement.reverseAction")}
            </Button>
          </>
        }
      >
        <textarea
          value={reverseDialog.comment}
          onChange={(e) =>
            setReverseDialog((prev) => ({
              ...prev,
              comment: e.target.value,
              error: "",
            }))
          }
          className="w-full min-h-24 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
        />
        {reverseDialog.error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {reverseDialog.error}
          </p>
        )}
      </AppDialog>
    </div>
  );
}
