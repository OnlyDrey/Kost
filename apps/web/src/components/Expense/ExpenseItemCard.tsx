import { CheckCircle2, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import TagPill from "../Common/TagPill";

import type { ReactNode } from "react";

interface ExpenseItemCardProps {
  vendor: string;
  description?: string | null;
  typeLabel: string;
  category?: string | null;
  frequencyLabel?: string | null;
  amountLabel?: string;
  shareLabel?: string;
  logoUrl?: string;
  paid?: boolean;
  overdue?: boolean;
  dateLabel?: string;
  onClick?: () => void;
  rightContent?: ReactNode;
  actionButton?: ReactNode;
  footerContent?: ReactNode;
  paidLabel?: string;
  overdueLabel?: string;
  showPaidIcon?: boolean;
}

export default function ExpenseItemCard({
  vendor,
  description,
  typeLabel,
  category,
  frequencyLabel,
  amountLabel,
  shareLabel,
  logoUrl,
  paid,
  overdue,
  dateLabel,
  onClick,
  rightContent,
  actionButton,
  footerContent,
  paidLabel,
  overdueLabel,
  showPaidIcon = true,
}: ExpenseItemCardProps) {
  const { t } = useTranslation();
  const borderClass = paid
    ? "border-green-300 dark:border-green-700"
    : overdue
      ? "border-red-300 dark:border-red-700"
      : "border-gray-200 dark:border-gray-800";

  const amountClass = paid
    ? "text-green-600 dark:text-green-400"
    : overdue
      ? "text-red-600 dark:text-red-400"
      : "text-indigo-600 dark:text-indigo-400";

  const cardBody = (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="w-12 h-12 rounded-md object-contain object-center bg-white border border-gray-200 dark:border-gray-700 flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-12 h-12 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
            <Store size={18} className="text-gray-400" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 line-clamp-2" title={vendor}>
            {vendor}
          </p>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5" title={description ?? undefined}>
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="w-full flex flex-wrap gap-1">
        {paid && (
          <span className="inline-flex items-center gap-1">
            <TagPill
              label={paidLabel ?? t("invoice.statusPaid")}
              variant="success"
            />
            {showPaidIcon && (
              <CheckCircle2
                size={12}
                className="text-green-600 dark:text-green-400"
              />
            )}
          </span>
        )}
        {overdue && (
          <TagPill
            label={overdueLabel ?? t("invoice.statusOverdue")}
            variant="danger"
          />
        )}
        <TagPill label={typeLabel} variant="type" />
        {category && <TagPill label={category} variant="category" />}
        {frequencyLabel && (
          <TagPill label={frequencyLabel} variant="frequency" />
        )}
      </div>

      {(amountLabel || rightContent || dateLabel || actionButton) && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            {amountLabel && (
              <p className={`text-2xl leading-[44px] font-bold ${amountClass}`}>
                {amountLabel}
              </p>
            )}
            {shareLabel && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {shareLabel}
              </p>
            )}
            {dateLabel && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                {dateLabel}
              </p>
            )}
          </div>

          {(rightContent || actionButton) && (
            <div className="ml-auto flex items-center justify-end gap-2.5 flex-wrap">
              {rightContent && <div className="shrink-0">{rightContent}</div>}
              {actionButton && <div className="shrink-0">{actionButton}</div>}
            </div>
          )}
        </div>
      )}

      {footerContent && (
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          {footerContent}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`relative bg-white dark:bg-gray-900 rounded-xl border ${borderClass} shadow-sm hover:shadow-md transition-all`}
    >
      {onClick ? (
        <button onClick={onClick} className="w-full text-left p-3">
          {cardBody}
        </button>
      ) : (
        <div className="p-3">{cardBody}</div>
      )}
    </div>
  );
}
