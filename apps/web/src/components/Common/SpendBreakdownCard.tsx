import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrencyFormatter } from "../../hooks/useApi";
import type { Invoice } from "../../services/api";

type Mode = "YOUR_SHARE" | "TOTAL";

export default function SpendBreakdownCard({
  invoices,
  currentUserId,
  currency: _currency,
  title,
}: {
  invoices: Invoice[];
  currentUserId?: string;
  currency: string;
  title: string;
}) {
  const { t } = useTranslation();
  const fmt = useCurrencyFormatter();
  const [mode, setMode] = useState<Mode>("YOUR_SHARE");

  const rows = useMemo(() => {
    const shareMap: Record<string, number> = {};
    const totalMap: Record<string, number> = {};
    for (const invoice of invoices) {
      const key = invoice.category || t("common.other");
      totalMap[key] = (totalMap[key] ?? 0) + invoice.totalCents;
      const myShare =
        invoice.shares?.find((s) => s.userId === currentUserId)?.shareCents ?? 0;
      shareMap[key] = (shareMap[key] ?? 0) + myShare;
    }

    return Object.keys(totalMap)
      .map((category) => ({
        category,
        shareCents: shareMap[category] ?? 0,
        totalCents: totalMap[category] ?? 0,
      }))
      .filter((entry) =>
        mode === "TOTAL" ? entry.totalCents > 0 : entry.shareCents > 0,
      )
      .sort((a, b) =>
        mode === "TOTAL"
          ? b.totalCents - a.totalCents
          : b.shareCents - a.shareCents,
      );
  }, [invoices, currentUserId, t, mode]);

  const grandTotal = rows.reduce(
    (sum, r) => sum + (mode === "TOTAL" ? r.totalCents : r.shareCents),
    0,
  );

  if (rows.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <div className="inline-flex w-full sm:w-auto rounded-lg border border-gray-200 dark:border-gray-700 p-0.5">
          <button
            onClick={() => setMode("YOUR_SHARE")}
            className={`flex-1 sm:flex-initial px-2.5 py-1 text-xs rounded-md transition-colors ${mode === "YOUR_SHARE" ? "bg-indigo-600 text-white font-semibold" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
          >
            {t("dashboard.yourShare")}
          </button>
          <button
            onClick={() => setMode("TOTAL")}
            className={`flex-1 sm:flex-initial px-2.5 py-1 text-xs rounded-md transition-colors ${mode === "TOTAL" ? "bg-indigo-600 text-white font-semibold" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
          >
            {t("dashboard.totalAmount")}
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {rows.map(({ category, shareCents, totalCents }) => {
          const primaryCents = mode === "TOTAL" ? totalCents : shareCents;
          const secondaryCents = mode === "TOTAL" ? shareCents : totalCents;
          const pct = grandTotal > 0 ? (primaryCents / grandTotal) * 100 : 0;
          return (
            <div key={`${mode}-${category}`} className="px-5 py-3.5">
              <div className="flex items-start justify-between mb-1.5 gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-0 truncate">
                  {category}
                </span>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 leading-tight">
                    {fmt(primaryCents)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {mode === "TOTAL"
                      ? t("dashboard.yourShare")
                      : t("dashboard.totalAmount")}
                    : {fmt(secondaryCents)}
                  </p>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${Math.min(100, pct).toFixed(1)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {pct.toFixed(1)}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
