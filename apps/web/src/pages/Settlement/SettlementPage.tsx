import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AppSelect from "../../components/Common/AppSelect";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../stores/auth.context";
import { amountToCents } from "../../utils/currency";
import {
  useCreateSettlementEntry,
  useCreateSettlementPlan,
  usePeriods,
  useSettlementSummary,
  useUsers,
  useReverseSettlementEntry,
  useCurrencyFormatter,
} from "../../hooks/useApi";

export default function SettlementPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const { data: periods = [] } = usePeriods();
  const closedPeriods = useMemo(() => periods.filter((period) => period.status === "CLOSED"), [periods]);
  const [periodId, setPeriodId] = useState(closedPeriods[0]?.id ?? periods[0]?.id ?? "");
  const { data: users = [] } = useUsers();
  const { data: summary } = useSettlementSummary(periodId);
  const fmt = useCurrencyFormatter();

  const createEntry = useCreateSettlementEntry();
  const createPlan = useCreateSettlementPlan();
  const reverseEntry = useReverseSettlementEntry();

  const [entryForm, setEntryForm] = useState({ fromUserId: "", toUserId: "", amount: "", type: "payment", comment: "", date: new Date().toISOString().slice(0, 10) });
  const [planForm, setPlanForm] = useState({ fromUserId: "", toUserId: "", planType: "full_next_period", configuredAmount: "", configuredPeriods: "", comment: "" });

  const userName = (id: string) => users.find((user) => user.id === id)?.name ?? id;

  const submitEntry = async () => {
    await createEntry.mutateAsync({
      periodId,
      fromUserId: entryForm.fromUserId,
      toUserId: entryForm.toUserId,
      amountCents: amountToCents(Number(entryForm.amount || "0")),
      type: entryForm.type as "payment" | "adjustment" | "write_down",
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
      planType: planForm.planType as "full_next_period" | "fixed_amount_per_period" | "fixed_number_of_periods",
      configuredAmountCents: planForm.configuredAmount ? amountToCents(Number(planForm.configuredAmount)) : undefined,
      configuredPeriodCount: planForm.configuredPeriods ? Number(planForm.configuredPeriods) : undefined,
      comment: planForm.comment,
      startPeriodId: periods.find((period) => period.status === "OPEN")?.id,
    });
    setPlanForm((prev) => ({ ...prev, configuredAmount: "", configuredPeriods: "", comment: "" }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("settlement.title")}</h1>
        <AppSelect value={periodId} onChange={(e) => setPeriodId(e.target.value)} className="h-10 w-44">
          {periods.map((period) => (
            <option key={period.id} value={period.id}>{period.id}</option>
          ))}
        </AppSelect>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Metric label={t("settlement.totalOwed")} value={fmt(summary?.totals.totalOwedCents ?? 0)} />
        <Metric label={t("settlement.totalPaid")} value={fmt(summary?.totals.totalPaidCents ?? 0)} />
        <Metric label={t("settlement.totalCredit")} value={fmt(summary?.totals.totalCreditCents ?? 0)} />
        <Metric label={t("settlement.totalUnpaid")} value={fmt(summary?.totals.totalUnpaidCents ?? 0)} />
        <Metric label={t("settlement.unresolvedWarnings")} value={String(summary?.totals.unresolvedWarningCount ?? 0)} />
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <h2 className="text-lg font-semibold mb-2">{t("settlement.overview")}</h2>
        <div className="overflow-auto">
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
                <tr key={`${row.fromUserId}-${row.toUserId}`} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-2 py-1">{userName(row.fromUserId)}</td>
                  <td className="px-2 py-1">{userName(row.toUserId)}</td>
                  <td className="px-2 py-1 text-right">{fmt(row.baseObligationCents)}</td>
                  <td className="px-2 py-1 text-right">-{fmt(row.carriedCreditCents)}</td>
                  <td className="px-2 py-1 text-right">+{fmt(row.plannedAdditionCents)}</td>
                  <td className="px-2 py-1 text-right">{fmt(row.paymentsCents)}</td>
                  <td className="px-2 py-1 text-right font-semibold">{fmt(row.remainingCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
          <h3 className="font-semibold">{t("settlement.registerPayment")}</h3>
          {!isAdmin && <p className="text-sm text-amber-600">{t("settlement.adminOnly")}</p>}
          <div className="grid grid-cols-2 gap-2">
            <AppSelect value={entryForm.fromUserId} onChange={(e) => setEntryForm((prev) => ({ ...prev, fromUserId: e.target.value }))} className="h-10">
              <option value="">{t("settlement.fromUser")}</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </AppSelect>
            <AppSelect value={entryForm.toUserId} onChange={(e) => setEntryForm((prev) => ({ ...prev, toUserId: e.target.value }))} className="h-10">
              <option value="">{t("settlement.toUser")}</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </AppSelect>
            <AppSelect value={entryForm.type} onChange={(e) => setEntryForm((prev) => ({ ...prev, type: e.target.value }))} className="h-10">
              <option value="payment">{t("settlement.payment")}</option>
              <option value="adjustment">{t("settlement.adjustment")}</option>
              <option value="write_down">{t("settlement.writeDown")}</option>
            </AppSelect>
            <input value={entryForm.amount} onChange={(e) => setEntryForm((prev) => ({ ...prev, amount: e.target.value }))} className="h-10 rounded-lg border px-3 text-sm" placeholder={t("settlement.amount")} />
            <input type="date" value={entryForm.date} onChange={(e) => setEntryForm((prev) => ({ ...prev, date: e.target.value }))} className="h-10 rounded-lg border px-3 text-sm" />
            <input value={entryForm.comment} onChange={(e) => setEntryForm((prev) => ({ ...prev, comment: e.target.value }))} className="h-10 rounded-lg border px-3 text-sm" placeholder={t("settlement.comment")} />
          </div>
          <Button disabled={!isAdmin || !periodId || !entryForm.fromUserId || !entryForm.toUserId || Number(entryForm.amount) <= 0 || entryForm.fromUserId === entryForm.toUserId} onClick={() => void submitEntry()}>{t("settlement.saveEntry")}</Button>
        </section>

        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
          <h3 className="font-semibold">{t("settlement.planTitle")}</h3>
          <div className="grid grid-cols-2 gap-2">
            <AppSelect value={planForm.fromUserId} onChange={(e) => setPlanForm((prev) => ({ ...prev, fromUserId: e.target.value }))} className="h-10">
              <option value="">{t("settlement.fromUser")}</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </AppSelect>
            <AppSelect value={planForm.toUserId} onChange={(e) => setPlanForm((prev) => ({ ...prev, toUserId: e.target.value }))} className="h-10">
              <option value="">{t("settlement.toUser")}</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </AppSelect>
            <AppSelect value={planForm.planType} onChange={(e) => setPlanForm((prev) => ({ ...prev, planType: e.target.value }))} className="h-10 col-span-2">
              <option value="full_next_period">{t("settlement.planFullNext")}</option>
              <option value="fixed_amount_per_period">{t("settlement.planFixedAmount")}</option>
              <option value="fixed_number_of_periods">{t("settlement.planFixedPeriods")}</option>
            </AppSelect>
            <input value={planForm.configuredAmount} onChange={(e) => setPlanForm((prev) => ({ ...prev, configuredAmount: e.target.value }))} className="h-10 rounded-lg border px-3 text-sm" placeholder={t("settlement.fixedAmountPerPeriod")} />
            <input value={planForm.configuredPeriods} onChange={(e) => setPlanForm((prev) => ({ ...prev, configuredPeriods: e.target.value }))} className="h-10 rounded-lg border px-3 text-sm" placeholder={t("settlement.numberOfPeriods")} />
            <input value={planForm.comment} onChange={(e) => setPlanForm((prev) => ({ ...prev, comment: e.target.value }))} className="h-10 rounded-lg border px-3 text-sm col-span-2" placeholder={t("settlement.comment")} />
          </div>
          <Button disabled={!isAdmin || !periodId || !planForm.fromUserId || !planForm.toUserId} onClick={() => void submitPlan()}>{t("settlement.createPlan")}</Button>
        </section>
      </div>

      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <h3 className="font-semibold mb-2">{t("settlement.history")}</h3>
        <div className="space-y-2">
          {(summary?.history ?? []).slice().sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map((entry) => (
            <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 border rounded-lg px-3 py-2">
              <div className="text-sm">
                <span className="font-medium">{entry.type}</span> · {userName(entry.fromUserId)} → {userName(entry.toUserId)} · {fmt(entry.amountCents)} · {entry.comment || "-"}
                {entry.reversedAt ? <span className="ml-2 text-red-600">({t("settlement.reversed")})</span> : null}
              </div>
              {!entry.reversedAt && isAdmin && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    const comment = window.prompt(t("settlement.reversalCommentPrompt")) || "";
                    if (!comment.trim()) return;
                    void reverseEntry.mutateAsync({ periodId, entryId: entry.id, comment });
                  }}
                >
                  {t("settlement.reverse")}
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>

      {!!summary?.warnings.length && (
        <section className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/10 p-4">
          <h3 className="font-semibold text-amber-800 dark:text-amber-300">{t("settlement.unresolvedUnpaid")}</h3>
          <ul className="list-disc pl-5 text-sm mt-2">
            {summary.warnings.map((warning, idx) => (
              <li key={`${warning.sourcePeriodId}-${idx}`}>
                {warning.sourcePeriodId}: {userName(warning.fromUserId)} → {userName(warning.toUserId)} = {fmt(warning.amountCents)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(summary?.rows ?? []).length > 0 && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <h3 className="font-semibold mb-2">{t("settlement.shareAdjustmentTitle")}</h3>
          <div className="text-sm text-gray-600 dark:text-gray-300">{t("settlement.shareAdjustmentDesc")}</div>
          <div className="mt-3 space-y-2">
            {summary!.rows.map((row) => (
              <div key={`s-${row.fromUserId}-${row.toUserId}`} className="rounded-lg border px-3 py-2 text-sm">
                <div className="font-medium">{userName(row.fromUserId)} → {userName(row.toUserId)}</div>
                <div>{t("settlement.baseShare")}: {fmt(row.baseObligationCents)}</div>
                <div>{t("settlement.creditPrevious")}: -{fmt(row.carriedCreditCents)}</div>
                <div>{t("settlement.planAddition")}: +{fmt(row.plannedAdditionCents)}</div>
                <div className="font-semibold">{t("settlement.remaining")}: {fmt(row.remainingCents)}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-base font-semibold mt-1">{value}</div>
    </div>
  );
}
