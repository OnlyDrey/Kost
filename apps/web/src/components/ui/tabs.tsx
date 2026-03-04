import type { ButtonHTMLAttributes, ReactNode } from "react";

interface TabButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: ReactNode;
}

export function TabButton({
  active = false,
  icon,
  className = "",
  children,
  ...props
}: TabButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 ${
        active
          ? "border-primary/60 bg-primary/15 text-primary"
          : "border-border bg-surface text-text-secondary hover:bg-surface-elevated"
      } ${className}`.trim()}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export function TabsRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`inline-flex min-w-full gap-2 ${className}`.trim()}>
      {children}
    </div>
  );
}
