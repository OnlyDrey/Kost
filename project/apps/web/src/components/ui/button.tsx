import type { ButtonHTMLAttributes, ReactNode } from "react";
import { CONTROL_HEIGHT, FOCUS_RING } from "../Common/focusStyles";

type Variant = "primary" | "secondary" | "success" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary/90",
  secondary:
    "border border-border bg-surface text-text-primary hover:bg-surface-elevated",
  success: "bg-success text-white hover:bg-success/90",
  danger: "bg-danger text-white hover:bg-danger/90",
  ghost: "text-text-primary hover:bg-surface-elevated",
};

export function Button({
  className = "",
  children,
  variant = "primary",
  icon,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`inline-flex ${CONTROL_HEIGHT} items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING} ${variants[variant]} ${className}`.trim()}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
