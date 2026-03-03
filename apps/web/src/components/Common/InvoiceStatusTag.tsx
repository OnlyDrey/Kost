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
          className: "bg-success/20 text-success",
        }
      : status === "PARTIALLY_PAID"
        ? {
            label: t("invoice.statusPartiallyPaid"),
            icon: Info,
            className: "bg-warning/20 text-warning",
          }
        : status === "OVERDUE"
          ? {
              label: t("invoice.statusOverdue"),
              icon: AlertTriangle,
              className: "bg-danger/20 text-danger",
            }
          : {
              label: t("invoice.statusUnpaid"),
              icon: AlertCircle,
              className: "bg-surface-elevated text-text-secondary",
            };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${config.className} ${className}`.trim()}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
}
