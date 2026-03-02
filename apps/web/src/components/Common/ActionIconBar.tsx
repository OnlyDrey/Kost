import type { LucideIcon } from "lucide-react";
import { useConfirmDialog } from "./ConfirmDialogProvider";

export interface ActionIconItem {
  key: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void | Promise<void>;
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
  const { confirm } = useConfirmDialog();
  const visibleItems = items.filter((item) => !item.hidden);

  if (!visibleItems.length) return null;

  return (
    <div
      className={`flex items-center ${tight ? "gap-0.5" : "gap-1"} ${className}`.trim()}
    >
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const enforcedEditColor =
          item.key === "edit"
            ? "bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 text-violet-500 dark:text-violet-400"
            : undefined;

        const colorClass = item.disabled
          ? (item.disabledClassName ?? "bg-disabled/20 text-disabled")
          : (enforcedEditColor ??
            item.colorClassName ??
            "bg-surface-elevated text-text-primary hover:bg-border");

        return (
          <button
            key={item.key}
            type="button"
            disabled={item.disabled}
            aria-label={item.label}
            title={item.label}
            onClick={async (event) => {
              if (stopPropagation) {
                event.stopPropagation();
              }
              if (item.disabled) return;
              if (item.destructive && item.confirmMessage) {
                const accepted = await confirm({
                  title: item.label,
                  message: item.confirmMessage,
                  tone: "danger",
                });
                if (!accepted) return;
              }
              await item.onClick();
            }}
            className={`h-10 w-10 inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus focus-visible:ring-offset-surface ${item.disabled ? "cursor-not-allowed" : ""}`}
          >
            <span
              className={`h-7 w-7 rounded-full inline-flex items-center justify-center transition-colors ${colorClass}`}
            >
              <Icon size={16} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
