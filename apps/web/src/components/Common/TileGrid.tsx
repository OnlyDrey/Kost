import type { ReactNode } from "react";

export interface TileItem {
  key: string;
  icon: React.ElementType;
  label: string;
  value: ReactNode;
  colorClass: string;
  onClick?: () => void;
}

export default function TileGrid({ items }: { items: TileItem[] }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-6 gap-2 sm:gap-3">
      {items.map(({ key, icon: Icon, label, value, colorClass, onClick }) => {
        const cls = `bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-3.5 shadow-sm min-w-0 ${onClick ? "cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700" : ""}`;
        return onClick ? (
        <button
          key={key}
          type="button"
          onClick={onClick}
          className={cls + " text-left"}
        >
          <div className="flex items-center gap-2 mb-1.5 min-h-7">
            <div
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center ${colorClass} shrink-0`}
            >
              <Icon size={12} className="text-white sm:w-[14px] sm:h-[14px]" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 leading-tight line-clamp-2">
              {label}
            </p>
          </div>
          <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 break-words leading-tight">
            {value}
          </p>
        </button>
        ) : (
        <div key={key} className={cls}>
          <div className="flex items-center gap-2 mb-1.5 min-h-7">
            <div
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center ${colorClass} shrink-0`}
            >
              <Icon size={12} className="text-white sm:w-[14px] sm:h-[14px]" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 leading-tight line-clamp-2">
              {label}
            </p>
          </div>
          <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 break-words leading-tight">
            {value}
          </p>
        </div>
        );
      })}
    </div>
  );
}
