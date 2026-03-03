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
          ? "bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900"
          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-200 dark:text-emerald-900"
      } ${className}`.trim()}
    >
      {isClosed ? t("period.closed") : t("period.open")}
    </span>
  );
}
