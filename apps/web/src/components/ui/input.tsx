import type { InputHTMLAttributes, ReactNode } from "react";
import { CONTROL_HEIGHT, FOCUS_RING } from "../Common/focusStyles";

export function Input({
  className = "",
  leadingIcon,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { leadingIcon?: ReactNode }) {
  return (
    <div className="relative">
      {leadingIcon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/70">
          {leadingIcon}
        </span>
      ) : null}
      <input
        className={`w-full ${CONTROL_HEIGHT} rounded-lg border border-border bg-surface px-3 text-sm text-text-primary transition-colors placeholder:text-text-secondary/70 hover:border-primary/40 ${FOCUS_RING} ${leadingIcon ? "pl-9" : ""} ${className}`.trim()}
        {...props}
      />
    </div>
  );
}
