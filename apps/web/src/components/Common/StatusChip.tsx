import { Lock, LockOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

type StatusChipProps = {
  status: "OPEN" | "CLOSED";
  className?: string;
  size?: "sm" | "md";
};

export default function StatusChip({
  status,
  className = "",
  size = "sm",
}: StatusChipProps) {
  const { t } = useTranslation();
  const isOpen = status === "OPEN";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${size === "md" ? "px-3 py-1 text-sm gap-1" : "px-2 py-0.5 text-xs gap-1"} ${
        isOpen
          ? "bg-green-900/40 text-green-400 border-green-700/40"
          : "bg-red-900/40 text-red-400 border-red-700/40"
      } ${className}`.trim()}
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
