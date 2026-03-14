import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { InvoiceStatus } from "../../utils/invoiceStatus";

type InvoiceStatusTagProps = {
  status: InvoiceStatus;
  className?: string;
};

export default function InvoiceStatusTag({
  status,
  className = "",
}: InvoiceStatusTagProps) {
  const { t } = useTranslation();

  const config =
    status === "PAID"
      ? {
          label: t("invoice.statusPaid"),
          icon: CheckCircle2,
          className:
            "border border-green-300 bg-green-100 text-green-700 dark:border-green-500/30 dark:bg-green-500/20 dark:text-green-300",
        }
      : status === "PARTIALLY_PAID"
        ? {
            label: t("invoice.statusPartiallyPaid"),
            icon: Info,
            className:
              "border border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300",
          }
        : status === "OVERDUE"
          ? {
              label: t("invoice.statusOverdue"),
              icon: AlertTriangle,
              className:
                "border border-red-300 bg-red-100 text-red-700 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-300",
            }
          : {
              label: t("invoice.statusUnpaid"),
              icon: AlertCircle,
              className:
                "border border-border bg-surface-elevated text-text-secondary",
            };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-semibold ${config.className} ${className}`.trim()}
    >
      <Icon size={14} />
      {config.label}
    </span>
  );
}
