import { useTranslation } from "react-i18next";

type PeriodStatusPillProps = {
  isClosed: boolean;
  className?: string;
};

export default function PeriodStatusPill({
  isClosed,
  className = "",
}: PeriodStatusPillProps) {
  const { t } = useTranslation();

  return (
    <span
      className={`inline-flex items-center rounded-lg px-3 py-1 text-sm font-medium ${
        isClosed
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
      } ${className}`.trim()}
    >
      {isClosed ? t("period.closed") : t("period.open")}
    </span>
  );
}
