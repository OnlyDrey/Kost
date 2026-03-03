import { CheckCircle2, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import TagPill from "../Common/TagPill";
import { FOCUS_RING_STRONG } from "../Common/focusStyles";
import InvoiceStatusTag from "../Common/InvoiceStatusTag";
import type { InvoiceStatus } from "../../utils/invoiceStatus";

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
  overdueLabel?: string;
  showPaidIcon?: boolean;
  selected?: boolean;
  showPaymentStatusPill?: boolean;
  focusRingClassName?: string;
  amountTone?: "default" | "partial";
  paymentStatus?: InvoiceStatus;
  amountDetails?: string[];
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
  overdueLabel,
  showPaidIcon = true,
  selected = false,
  showPaymentStatusPill = true,
  focusRingClassName,
  amountTone = "default",
  paymentStatus,
  amountDetails,
}: ExpenseItemCardProps) {
  const { t } = useTranslation();
  const emphasisClass = paid
    ? "border-success/60 bg-success/5"
    : overdue
      ? "border-danger/60 bg-danger/5"
      : selected
        ? "border-primary/60 bg-primary/5"
        : "border-app-border";

  const amountClass = paid
    ? "text-success"
    : overdue
      ? "text-danger"
      : amountTone === "partial"
        ? "text-warning"
        : "text-primary";

  const effectiveFocusRing =
    focusRingClassName ??
    (paid
      ? "focus-visible:ring-success/45"
      : overdue
        ? "focus-visible:ring-danger/45"
        : "focus-visible:ring-primary/45");

  const cardBody = (
    <div className="flex flex-col gap-2.5">
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
          <p
            className="text-[15px] font-semibold text-app-text-primary line-clamp-2"
            title={vendor}
          >
            {vendor}
          </p>
          {description && (
            <p
              className="text-sm text-app-text-secondary line-clamp-2 mt-0"
              title={description ?? undefined}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="w-full flex flex-wrap gap-1">
        {showPaymentStatusPill && (
          <InvoiceStatusTag
            status={paymentStatus ?? (paid ? "PAID" : overdue ? "OVERDUE" : "UNPAID")}
          />
        )}
        {overdue && (
          <TagPill
            label={overdueLabel ?? t("invoice.statusOverdue")}
            variant="danger"
          />
        )}
        {paid && showPaidIcon && (
          <span className="inline-flex items-center gap-1 text-success text-xs">
            <CheckCircle2 size={12} className="text-success" />
          </span>
        )}
        <TagPill label={typeLabel} variant="type" />
        {category && <TagPill label={category} variant="category" />}
        {frequencyLabel && (
          <TagPill label={frequencyLabel} variant="frequency" />
        )}
      </div>

      {(amountLabel || rightContent || dateLabel || actionButton) && (
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center justify-between gap-x-2.5 gap-y-1 min-w-0">
            <div className="min-w-0 flex-1">
              {amountLabel && (
                <p
                  className={`text-xl sm:text-2xl leading-none font-bold m-0 ${amountClass}`}
                >
                  {amountLabel}
                </p>
              )}
              {shareLabel && (
                <p className="text-xs text-app-text-secondary mt-0">
                  {shareLabel}
                </p>
              )}
              {amountDetails?.map((line) => (
                <p key={line} className="text-xs text-app-text-secondary mt-0">
                  {line}
                </p>
              ))}
            </div>

            {(rightContent || actionButton) && (
              <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
                {rightContent && <div className="shrink-0">{rightContent}</div>}
                {actionButton && <div className="shrink-0">{actionButton}</div>}
              </div>
            )}
          </div>

          {dateLabel && (
            <p className="text-xs text-app-text-secondary">{dateLabel}</p>
          )}
        </div>
      )}

      {footerContent && (
        <div className="pt-1.5 border-t border-gray-100 dark:border-gray-800">
          {footerContent}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`relative bg-app-surface rounded-xl border ${emphasisClass} shadow-sm hover:shadow-md transition-all`}
    >
      {onClick ? (
        <button
          onClick={onClick}
          className={`block w-full text-left p-3 rounded-xl ${FOCUS_RING_STRONG} ${effectiveFocusRing}`}
        >
          {cardBody}
        </button>
      ) : (
        <div className="p-3">{cardBody}</div>
      )}
    </div>
  );
}
