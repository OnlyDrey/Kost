import type { InputHTMLAttributes } from "react";
import { Check } from "lucide-react";

type ThemedCheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  controlSize?: "sm" | "md";
};

export function ThemedCheckbox({
  className = "",
  controlSize = "sm",
  ...props
}: ThemedCheckboxProps) {
  const sizeClass = controlSize === "md" ? "h-7 w-7" : "h-5 w-5";
  const iconSize = controlSize === "md" ? 14 : 12;

  return (
    <label
      className={`relative inline-flex ${sizeClass} flex-shrink-0 cursor-pointer items-center justify-center ${className}`.trim()}
    >
      <input
        type="checkbox"
        className={`peer ${sizeClass} appearance-none rounded-md border border-border/80 bg-slate-900/40 transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/70 checked:border-primary checked:bg-primary disabled:cursor-not-allowed disabled:opacity-50`}
        {...props}
      />
      <Check
        size={iconSize}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
      />
    </label>
  );
}
