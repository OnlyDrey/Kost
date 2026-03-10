import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { FOCUS_RING } from "./focusStyles";

type IconStatCardProps = {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  iconBgClass: string;
  iconTextClass?: string;
  onClick?: () => void;
};

export default function IconStatCard({
  icon: Icon,
  label,
  value,
  iconBgClass,
  iconTextClass = "text-white",
  onClick,
}: IconStatCardProps) {
  const cls = `bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-3.5 shadow-sm min-w-0 ${onClick ? "cursor-pointer hover:border-primary/40 dark:hover:border-primary/40" : ""}`;

  const content = (
    <>
      <div className="flex items-center gap-2 mb-1.5 min-h-7">
        <div
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center ${iconBgClass} shrink-0`}
        >
          <Icon size={12} className={`${iconTextClass} sm:w-[14px] sm:h-[14px]`} />
        </div>
        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 leading-tight line-clamp-2">
          {label}
        </p>
      </div>
      <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 break-words leading-tight">
        {value}
      </p>
    </>
  );

  if (!onClick) return <div className={cls}>{content}</div>;

  return (
    <button type="button" onClick={onClick} className={`${cls} text-left ${FOCUS_RING}`}>
      {content}
    </button>
  );
}
