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
  size = "md",
}: {
  items: ActionIconItem[];
  tight?: boolean;
  className?: string;
  stopPropagation?: boolean;
  showLabelFromMd?: boolean;
  size?: "md" | "lg";
}) {
  const { confirm } = useConfirmDialog();
  const visibleItems = items.filter((item) => !item.hidden);
  const sizeClass = size === "lg" ? "h-11" : "h-10";
  const widthClass = size === "lg" ? "w-11" : "w-10";
  const iconSize = size === "lg" ? 18 : 16;

  if (!visibleItems.length) return null;

  return (
    <div
      className={`flex items-center ${tight ? "gap-1" : "gap-2"} ${className}`.trim()}
    >
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const colorClass = item.disabled
          ? (item.disabledClassName ??
            "border border-border bg-disabled/20 text-disabled")
          : (item.colorClassName ??
            "border border-border bg-surface text-text-primary hover:bg-surface-elevated");

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
            className={`inline-flex ${sizeClass} ${showLabelFromMd ? "md:w-auto md:px-3" : widthClass} items-center justify-center rounded-full text-sm transition-colors ${FOCUS_RING} ${colorClass} ${item.disabled ? "cursor-not-allowed" : ""}`}
          >
            <Icon size={iconSize} />
            {showLabelFromMd && (
              <span className="ml-1.5 hidden md:inline font-medium">
                {item.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
