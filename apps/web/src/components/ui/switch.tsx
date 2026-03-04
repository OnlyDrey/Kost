import type { ButtonHTMLAttributes } from "react";
import { FOCUS_RING } from "../Common/focusStyles";

interface SwitchProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange"
> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function Switch({
  checked,
  onCheckedChange,
  className = "",
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${FOCUS_RING} ${checked ? "border-primary/60 bg-primary/25" : "border-border bg-surface-elevated"} ${className}`.trim()}
      {...props}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-100 shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}
