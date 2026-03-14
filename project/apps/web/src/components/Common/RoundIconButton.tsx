import type { ButtonHTMLAttributes, ReactNode } from "react";
import { FOCUS_RING } from "./focusStyles";

type RoundIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  label: string;
  colorClassName?: string;
  showLabelFromMd?: boolean;
};

export default function RoundIconButton({
  icon,
  label,
  className = "",
  colorClassName = "border border-border bg-surface text-text-primary hover:bg-surface-elevated",
  showLabelFromMd = false,
  ...props
}: RoundIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex w-10 h-10 items-center justify-center rounded-full md:rounded-lg text-sm transition-colors ${FOCUS_RING} ${showLabelFromMd ? "md:w-auto md:px-3" : ""} ${colorClassName} ${className}`.trim()}
      {...props}
    >
      {icon}
      {showLabelFromMd && (
        <span className="ml-1.5 hidden md:inline font-medium">{label}</span>
      )}
    </button>
  );
}
