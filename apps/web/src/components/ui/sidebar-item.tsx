import type { ButtonHTMLAttributes, ReactNode } from "react";

interface SidebarItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: ReactNode;
}

export function SidebarItem({
  active = false,
  icon,
  className = "",
  children,
  ...props
}: SidebarItemProps) {
  return (
    <button
      type="button"
      className={`relative w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 ${
        active
          ? "border-primary/40 bg-primary/15 text-primary"
          : "border-transparent text-text-secondary hover:bg-surface-elevated"
      } ${className}`.trim()}
      {...props}
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );
}
