import type { InputHTMLAttributes } from "react";
import { Check } from "lucide-react";

export function Checkbox({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`relative inline-flex h-4 w-4 flex-shrink-0 cursor-pointer ${className}`.trim()}>
      <input
        type="checkbox"
        className="peer h-4 w-4 appearance-none rounded-[4px] border border-border bg-surface transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/70 checked:border-primary checked:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
      <Check
        size={12}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
      />
    </label>
  );
}
