import type { ButtonHTMLAttributes, ReactNode } from "react";
import { FOCUS_RING } from "../Common/focusStyles";

type IconButtonVariant = "neutral" | "violet" | "danger" | "success";

const variantClassMap: Record<IconButtonVariant, string> = {
  neutral:
    "border-border bg-surface text-text-secondary hover:bg-surface-elevated",
  violet: "border-primary/35 bg-primary/20 text-primary hover:bg-primary/30",
  danger: "border-danger/35 bg-danger/20 text-danger hover:bg-danger/30",
  success: "border-success/35 bg-success/20 text-success hover:bg-success/30",
};

export function IconButton({
  className = "",
  children,
  size = "md",
  variant = "neutral",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md";
  variant?: IconButtonVariant;
  children: ReactNode;
}) {
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  return (
    <button
      type="button"
      className={`inline-flex ${sizeClass} items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING} ${variantClassMap[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
