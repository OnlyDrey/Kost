import { Lock, LockOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

type PeriodStatusBadgeProps = {
  status: "OPEN" | "CLOSED";
  className?: string;
  size?: "sm" | "md";
  variant?: "chip" | "field";
};

export default function PeriodStatusBadge({
  status,
  className = "",
  size = "sm",
  variant = "chip",
}: PeriodStatusBadgeProps) {
  const { t } = useTranslation();
  const isOpen = status === "OPEN";

  return (
    <span
      className={`inline-flex items-center font-medium ${
        variant === "field"
          ? "h-10 rounded-lg px-3 gap-1.5 text-sm"
          : size === "md"
            ? "rounded-full px-3 py-1 gap-1 text-sm"
            : "rounded-full px-2 py-0.5 gap-1 text-xs"
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
