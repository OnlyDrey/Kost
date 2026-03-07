import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CircleCheckBig, Scale, Wallet } from "lucide-react";
import AppSelect from "../../components/Common/AppSelect";
import TileGrid from "../../components/Common/TileGrid";
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

function safeCents(value: number): number {
  return Math.abs(value) < 1 ? 0 : value;
}

const inputCls =
  `w-full ${CONTROL_HEIGHT} px-3.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm`;
const dateInputCls = `${inputCls} w-full min-w-0 max-w-full box-border appearance-none`;

export default function SettlementPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const fmt = useCurrencyFormatter();

  const { data: periods = [] } = usePeriods();
  const closedPeriods = useMemo(
    () => periods.filter((period) => period.status === "CLOSED"),
    [periods],
  );
  const [periodId, setPeriodId] = useState(
    closedPeriods[0]?.id ?? periods[0]?.id ?? "",
  );

  const { data: users = [] } = useUsers();
  const { data: summary } = useSettlementSummary(periodId);
  const createEntry = useCreateSettlementEntry();
  const createPlan = useCreateSettlementPlan();
  const reverseEntry = useReverseSettlementEntry();

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

  const sortedHistory = useMemo(
    () =>
      [...(summary?.history ?? [])].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    [summary?.history],
  );

  const userName = (id: string) =>
    users.find((user) => user.id === id)?.name ?? id;

  const netBalanceCents = safeCents(
    (summary?.totals.totalUnpaidCents ?? 0) -
      (summary?.totals.totalCreditCents ?? 0),
  );
  const netBalanceText =
    netBalanceCents === 0
      ? t("settlement.balanceSettled")
      : netBalanceCents > 0
        ? t("settlement.balanceDebt")
        : t("settlement.balanceCredit");

  const submitEntry = async () => {
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
        <AppSelect
          value={periodId}
          onChange={(e) => setPeriodId(e.target.value)}
          className="h-10 w-full sm:w-44"
        >
          {periods.map((period) => (
            <option key={period.id} value={period.id}>
              {period.id}
            </option>
          ))}
        </AppSelect>
      </div>

      <TileGrid
        items={[
          {
            key: "total-owed",
            icon: Wallet,
            label: t("settlement.totalOwed"),
            value: fmt(safeCents(summary?.totals.totalOwedCents ?? 0)),
            colorClass: "bg-amber-500",
          },
          {
            key: "total-paid",
            icon: CircleCheckBig,
            label: t("settlement.totalPaid"),
            value: fmt(safeCents(summary?.totals.totalPaidCents ?? 0)),
            colorClass: "bg-green-500",
          },
          {
            key: "net-balance",
            icon: Scale,
            label: t("settlement.netBalance"),
            value: `${netBalanceText}: ${fmt(Math.abs(netBalanceCents))}`,
            colorClass: netBalanceCents > 0 ? "bg-red-500" : netBalanceCents < 0 ? "bg-blue-500" : "bg-slate-500",
          },
          {
            key: "warnings",
            icon: AlertTriangle,
            label: t("settlement.unresolvedWarnings"),
            value: String(summary?.totals.unresolvedWarningCount ?? 0),
            colorClass: "bg-orange-500",
          },
        ]}
      />

      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h2 className="text-lg font-semibold">{t("settlement.overview")}</h2>

        {/* Mobile stacked cards */}
        <div className="space-y-2 md:hidden">
          {(summary?.rows ?? []).map((row) => (
            <div
              key={`${row.fromUserId}-${row.toUserId}`}
              className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-sm space-y-1"
            >
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {userName(row.fromUserId)} → {userName(row.toUserId)}
              </div>
              <div>
                {t("settlement.baseObligation")}: {fmt(safeCents(row.baseObligationCents))}
              </div>
              <div>
                {t("settlement.carriedCredit")}: {fmt(safeCents(row.carriedCreditCents))}
              </div>
              <div>
                {t("settlement.planAddition")}: {fmt(safeCents(row.plannedAdditionCents))}
              </div>
              <div>
                {t("settlement.payments")}: {fmt(safeCents(row.paymentsCents))}
              </div>
              <div className="font-semibold text-gray-900 dark:text-gray-100 pt-1">
                {t("settlement.remaining")}: {fmt(safeCents(row.remainingCents))}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="text-left px-2 py-1">{t("settlement.fromUser")}</th>
                <th className="text-left px-2 py-1">{t("settlement.toUser")}</th>
                <th className="text-right px-2 py-1">{t("settlement.baseObligation")}</th>
                <th className="text-right px-2 py-1">{t("settlement.carriedCredit")}</th>
                <th className="text-right px-2 py-1">{t("settlement.planAddition")}</th>
                <th className="text-right px-2 py-1">{t("settlement.payments")}</th>
                <th className="text-right px-2 py-1">{t("settlement.remaining")}</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.rows ?? []).map((row) => (
                <tr
                  key={`${row.fromUserId}-${row.toUserId}`}
                  className="border-t border-gray-200 dark:border-gray-700"
                >
                  <td className="px-2 py-1">{userName(row.fromUserId)}</td>
                  <td className="px-2 py-1">{userName(row.toUserId)}</td>
                  <td className="px-2 py-1 text-right">
                    {fmt(safeCents(row.baseObligationCents))}
                  </td>
                  <td className="px-2 py-1 text-right">
                    {fmt(safeCents(row.carriedCreditCents))}
                  </td>
                  <td className="px-2 py-1 text-right">
                    {fmt(safeCents(row.plannedAdditionCents))}
                  </td>
                  <td className="px-2 py-1 text-right">
                    {fmt(safeCents(row.paymentsCents))}
                  </td>
                  <td className="px-2 py-1 text-right font-semibold">
                    {fmt(safeCents(row.remainingCents))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
          <h3 className="font-semibold">{t("settlement.registerPayment")}</h3>
          {!isAdmin && (
            <p className="text-sm text-amber-600">{t("settlement.adminOnly")}</p>
          )}

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <AppSelect
                value={entryForm.fromUserId}
                onChange={(e) =>
                  setEntryForm((prev) => ({ ...prev, fromUserId: e.target.value }))
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
                value={entryForm.toUserId}
                onChange={(e) =>
                  setEntryForm((prev) => ({ ...prev, toUserId: e.target.value }))
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
            <input
              value={entryForm.amount}
              onChange={(e) =>
                setEntryForm((prev) => ({ ...prev, amount: e.target.value }))
              }
              className={inputCls}
              placeholder={t("settlement.amount")}
            />
            <input
              type="date"
              value={entryForm.date}
              onChange={(e) =>
                setEntryForm((prev) => ({ ...prev, date: e.target.value }))
              }
              className={dateInputCls}
            />
            <input
              value={entryForm.comment}
              onChange={(e) =>
                setEntryForm((prev) => ({ ...prev, comment: e.target.value }))
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
              !entryForm.fromUserId ||
              !entryForm.toUserId ||
              Number(entryForm.amount) <= 0 ||
              entryForm.fromUserId === entryForm.toUserId
            }
            onClick={() => void submitEntry()}
          >
            {t("settlement.saveEntry")}
          </Button>
        </section>

        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
          <h3 className="font-semibold">{t("settlement.planTitle")}</h3>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <AppSelect
                value={planForm.fromUserId}
                onChange={(e) =>
                  setPlanForm((prev) => ({ ...prev, fromUserId: e.target.value }))
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
                  setPlanForm((prev) => ({ ...prev, toUserId: e.target.value }))
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
                setPlanForm((prev) => ({ ...prev, planType: e.target.value }))
              }
              className="h-10"
            >
              <option value="full_next_period">{t("settlement.planFullNext")}</option>
              <option value="fixed_amount_per_period">{t("settlement.planFixedAmount")}</option>
              <option value="fixed_number_of_periods">{t("settlement.planFixedPeriods")}</option>
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
                setPlanForm((prev) => ({ ...prev, comment: e.target.value }))
              }
              className={inputCls}
              placeholder={t("settlement.comment")}
            />
          </div>

          <Button
            className="w-full sm:w-auto"
            disabled={!isAdmin || !periodId || !planForm.fromUserId || !planForm.toUserId}
            onClick={() => void submitPlan()}
          >
            {t("settlement.createPlan")}
          </Button>
        </section>
      </div>

      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <h3 className="font-semibold mb-2">{t("settlement.history")}</h3>
        {sortedHistory.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("settlement.historyEmpty")}
          </p>
        ) : (
          <div className="space-y-2">
            {sortedHistory.map((entry) => (
              <div
                key={entry.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{entry.type}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(entry.effectiveDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-1">
                  {userName(entry.fromUserId)} → {userName(entry.toUserId)}
                </div>
                <div className="font-semibold">{fmt(safeCents(entry.amountCents))}</div>
                {entry.comment && (
                  <div className="text-gray-600 dark:text-gray-300 mt-0.5">
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
                    className="w-full sm:w-auto mt-2"
                    onClick={() => {
                      const comment =
                        window.prompt(t("settlement.reversalCommentPrompt")) || "";
                      if (!comment.trim()) return;
                      void reverseEntry.mutateAsync({
                        periodId,
                        entryId: entry.id,
                        comment,
                      });
                    }}
                  >
                    {t("settlement.reverse")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {!!summary?.warnings.length && (
        <section className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/10 p-4">
          <h3 className="font-semibold text-amber-800 dark:text-amber-300">
            {t("settlement.unresolvedUnpaid")}
          </h3>
          <ul className="list-disc pl-5 text-sm mt-2 space-y-1 text-amber-900 dark:text-amber-200">
            {summary.warnings.map((warning, idx) => (
              <li key={`${warning.sourcePeriodId}-${idx}`}>
                {warning.sourcePeriodId}: {userName(warning.fromUserId)} → {userName(warning.toUserId)} = {fmt(safeCents(warning.amountCents))}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(summary?.rows ?? []).length > 0 && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <h3 className="font-semibold mb-2">{t("settlement.shareAdjustmentTitle")}</h3>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {t("settlement.shareAdjustmentDesc")}
          </div>
          <div className="mt-3 space-y-2">
            {summary!.rows.map((row) => (
              <div
                key={`s-${row.fromUserId}-${row.toUserId}`}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm space-y-1"
              >
                <div className="font-medium">
                  {userName(row.fromUserId)} → {userName(row.toUserId)}
                </div>
                <div>
                  {t("settlement.baseShare")}: {fmt(safeCents(row.baseObligationCents))}
                </div>
                <div>
                  {t("settlement.creditPrevious")}: {fmt(safeCents(row.carriedCreditCents))}
                </div>
                <div>
                  {t("settlement.planAddition")}: {fmt(safeCents(row.plannedAdditionCents))}
                </div>
                <div className="font-semibold text-gray-900 dark:text-gray-100 pt-1">
                  {t("settlement.remaining")}: {fmt(safeCents(row.remainingCents))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
