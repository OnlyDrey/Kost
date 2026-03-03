import type { ButtonHTMLAttributes, ReactNode } from "react";
import { FOCUS_RING } from "../Common/focusStyles";

export function IconButton({
  className = "",
  children,
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md";
  children: ReactNode;
}) {
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  return (
    <button
      type="button"
      className={`inline-flex ${sizeClass} items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:bg-surface-elevated ${FOCUS_RING} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
