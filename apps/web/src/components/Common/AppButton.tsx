import type { ButtonHTMLAttributes, ReactNode } from "react";
import { FOCUS_RING } from "./focusStyles";

type AppButtonVariant =
  | "primary"
  | "success"
  | "danger"
  | "warning"
  | "neutral";
type AppButtonTone = "solid" | "outline";

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AppButtonVariant;
  tone?: AppButtonTone;
  loading?: boolean;
  icon?: ReactNode;
}

const variantClassMap: Record<
  AppButtonVariant,
  { solid: string; outline: string }
> = {
  primary: {
    solid: "bg-primary text-white hover:bg-primary/90",
    outline: "border border-primary/40 text-primary hover:bg-primary/10",
  },
  success: {
    solid: "bg-success text-white hover:bg-success/90",
    outline: "border border-success/40 text-success hover:bg-success/10",
  },
  danger: {
    solid: "bg-danger text-white hover:bg-danger/90",
    outline: "border border-danger/40 text-danger hover:bg-danger/10",
  },
  warning: {
    solid: "bg-warning text-white hover:bg-warning/90",
    outline: "border border-warning/40 text-warning hover:bg-warning/10",
  },
  neutral: {
    solid: "bg-neutral text-white hover:bg-neutral/90",
    outline:
      "border border-border text-text-secondary hover:bg-surface-elevated",
  },
};

export default function AppButton({
  children,
  className = "",
  variant = "primary",
  tone = "solid",
  loading = false,
  icon,
  disabled,
  ...props
}: AppButtonProps) {
  const variantClass = variantClassMap[variant][tone];

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${FOCUS_RING} ${variantClass} ${className}`.trim()}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {!loading && icon ? icon : null}
      {children}
    </button>
  );
}
