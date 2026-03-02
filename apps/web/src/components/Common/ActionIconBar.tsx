import type { LucideIcon } from "lucide-react";
import { useConfirmDialog } from "./ConfirmDialogProvider";
import { FOCUS_RING } from "./focusStyles";

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
  showLabelFromMd = false,
}: {
  items: ActionIconItem[];
  tight?: boolean;
  className?: string;
  stopPropagation?: boolean;
  showLabelFromMd?: boolean;
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
        const colorClass = item.disabled
          ? (item.disabledClassName ?? "bg-disabled/20 text-disabled")
          : (item.colorClassName ??
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
            className={`inline-flex h-10 ${showLabelFromMd ? "md:w-auto md:px-3" : "w-10"} items-center justify-center rounded-full transition-colors ${FOCUS_RING} ${item.disabled ? "cursor-not-allowed" : ""}`}
          >
            <span
              className={`h-7 ${showLabelFromMd ? "w-7 md:w-auto md:px-2" : "w-7"} rounded-full inline-flex items-center justify-center transition-colors gap-1.5 ${colorClass}`}
            >
              <Icon size={16} />
              {showLabelFromMd && <span className="hidden md:inline text-xs font-medium">{item.label}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
