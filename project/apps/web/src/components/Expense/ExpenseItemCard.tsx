
import { useTranslation } from "react-i18next";
import TagPill from "../Common/TagPill";
import { useSettings } from "../../stores/settings.context";
import VendorAvatar from "../Common/VendorAvatar";
import { FOCUS_RING_STRONG } from "../Common/focusStyles";
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
  const { settings } = useSettings();
  const emphasisClass = paid
    ? "border-success/60 bg-success/5"
    : overdue
      ? "border-danger/60 bg-danger/5"
      : selected
        ? "border-primary/60 bg-primary/5"
        : "border-app-border";

  const amountClass = "text-gray-900 dark:text-gray-100";

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
        <VendorAvatar
          vendorName={vendor}
          logoUrl={logoUrl}
          show={settings.branding.showVendorImages}
        />

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
        {overdue && (
          <TagPill
            label={overdueLabel ?? t("invoice.statusOverdue")}
            variant="danger"
          />
        )}
        <TagPill label={typeLabel} variant="type" />
        {frequencyLabel && <TagPill label={frequencyLabel} variant="frequency" />}
      </div>

      {(amountLabel || rightContent || actionButton || dateLabel) && (
        <div className="grid grid-cols-2 gap-2 items-start">
          <div className="min-w-0">
            {amountLabel && (
              <p className={`text-lg sm:text-2xl leading-tight font-bold m-0 break-words ${amountClass}`}>
                {amountLabel}
              </p>
            )}
            {shareLabel && <p className="text-xs text-app-text-secondary mt-0.5">{shareLabel}</p>}
            {amountDetails?.map((line) => (
              <p key={line} className="text-xs text-app-text-secondary mt-0">
                {line}
              </p>
            ))}
          </div>
          <div className="min-w-0 flex flex-col items-end gap-1">
            {dateLabel && <p className="text-xs text-app-text-secondary text-right">{dateLabel}</p>}
            {(rightContent || actionButton) && (
              <div className="ml-auto flex items-center gap-2">
                {rightContent && <div className="shrink-0">{rightContent}</div>}
                {actionButton && <div className="shrink-0">{actionButton}</div>}
              </div>
            )}
          </div>
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
      className={`relative bg-app-surface rounded-xl border ${emphasisClass} shadow-sm transition-all hover:shadow-md`}
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
