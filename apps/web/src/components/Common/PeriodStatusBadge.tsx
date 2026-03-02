import { Lock, LockOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

type PeriodStatusBadgeProps = {
  status: "OPEN" | "CLOSED";
  className?: string;
  size?: "sm" | "md";
};

export default function PeriodStatusBadge({
  status,
  className = "",
  size = "sm",
}: PeriodStatusBadgeProps) {
  const { t } = useTranslation();
  const isOpen = status === "OPEN";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"
      } ${isOpen ? "bg-success/20 text-success" : "bg-danger/20 text-danger"} ${className}`.trim()}
    >
      {isOpen ? (
        <LockOpen size={size === "md" ? 14 : 11} />
      ) : (
        <Lock size={size === "md" ? 14 : 11} />
      )}
      {isOpen ? t("period.open") : t("period.closed")}
    </span>
  );
}
