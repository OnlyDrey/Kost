import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eraser } from "lucide-react";
import { useCurrencyFormatter } from "../../hooks/useApi";
import { IconButton } from "../ui/icon-button";
import { SegmentedControl } from "../ui/segmented-control";
import type { Invoice } from "../../services/api";

type Mode = "YOUR_SHARE" | "TOTAL";

export default function SpendBreakdownCard({
  invoices,
  currentUserId,
  selectedShareUserId,
  selectedShareUserName,
  currency: _currency,
  title,
  selectedCategory,
  onSelectCategory,
  onResetCategory,
}: {
  invoices: Invoice[];
  currentUserId?: string;
  selectedShareUserId?: string;
  selectedShareUserName?: string;
  currency: string;
  title: string;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  onResetCategory?: () => void;
}) {
  const { t } = useTranslation();
  const fmt = useCurrencyFormatter();
  const [mode, setMode] = useState<Mode>("YOUR_SHARE");
  const effectiveShareUserId = selectedShareUserId || currentUserId;
  const shareLabel =
    selectedShareUserName && selectedShareUserId
      ? t("dashboard.userShare", { name: selectedShareUserName })
      : t("dashboard.yourShare");

  const rows = useMemo(() => {
    const shareMap: Record<string, number> = {};
    const totalMap: Record<string, number> = {};
    for (const invoice of invoices) {
      const key = invoice.category || t("common.other");
      totalMap[key] = (totalMap[key] ?? 0) + invoice.totalCents;
      const myShare =
        invoice.shares?.find((s) => s.userId === effectiveShareUserId)
          ?.shareCents ?? 0;
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
  }, [invoices, effectiveShareUserId, t, mode]);

  const grandTotal = rows.reduce(
    (sum, r) => sum + (mode === "TOTAL" ? r.totalCents : r.shareCents),
    0,
  );

  if (rows.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            {title}
          </h2>
          {onResetCategory && (
            <IconButton
              type="button"
              onClick={onResetCategory}
              aria-label={t("common.reset")}
              className={
                selectedCategory ? "border-primary/40 text-primary" : ""
              }
            >
              <Eraser size={16} />
            </IconButton>
          )}
        </div>
        <div className="w-full sm:w-auto">
          <SegmentedControl
            value={mode}
            onChange={setMode}
            options={[
              { value: "YOUR_SHARE", label: shareLabel },
              { value: "TOTAL", label: t("dashboard.totalAmount") },
            ]}
          />
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {rows.map(({ category, shareCents, totalCents }) => {
          const primaryCents = mode === "TOTAL" ? totalCents : shareCents;
          const secondaryCents = mode === "TOTAL" ? shareCents : totalCents;
          const pct = grandTotal > 0 ? (primaryCents / grandTotal) * 100 : 0;
          const selected = selectedCategory === category;
          return (
            <button
              key={`${mode}-${category}`}
              type="button"
              onClick={() => onSelectCategory?.(category)}
              className={`w-full px-5 py-3.5 text-left rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${selected ? "border-primary/60 bg-primary/10" : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/70"}`}
            >
              <div className="flex items-start justify-between mb-1.5 gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-0 truncate">
                  {category}
                </span>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-bold text-primary leading-tight">
                    {fmt(primaryCents)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {mode === "TOTAL" ? shareLabel : t("dashboard.totalAmount")}
                    : {fmt(secondaryCents)}
                  </p>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, pct).toFixed(1)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {pct.toFixed(1)}%
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
