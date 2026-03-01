import type { LucideIcon } from "lucide-react";

export interface ActionIconItem {
  key: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  colorClassName?: string;
  disabled?: boolean;
  disabledClassName?: string;
  hidden?: boolean;
  destructive?: boolean;
  confirmMessage?: string;
}

export default function ActionIconBar({
  items,
  tight = false,
  className = "",
  stopPropagation = false,
}: {
  items: ActionIconItem[];
  tight?: boolean;
  className?: string;
  stopPropagation?: boolean;
}) {
  const visibleItems = items.filter((item) => !item.hidden);

  if (!visibleItems.length) return null;

  return (
    <div
      className={`flex items-center ${tight ? "gap-[5px]" : "gap-[5px]"} ${className}`.trim()}
    >
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const colorClass = item.disabled
          ? item.disabledClassName ?? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
          : item.colorClassName ??
            "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700";

        return (
          <button
            key={item.key}
            type="button"
            disabled={item.disabled}
            aria-label={item.label}
            title={item.label}
            onClick={(event) => {
              if (stopPropagation) {
                event.stopPropagation();
              }
              if (item.disabled) return;
              if (item.destructive && item.confirmMessage && !confirm(item.confirmMessage)) {
                return;
              }
              item.onClick();
            }}
            className={`h-11 w-11 inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-offset-gray-900 ${item.disabled ? "cursor-not-allowed" : ""}`}
          >
            <span
              className={`h-8 w-8 rounded-full inline-flex items-center justify-center transition-colors ${colorClass}`}
            >
              <Icon size={16} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
