import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { SELECT_TRIGGER } from "./focusStyles";

type AppSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string;
};

export default function AppSelect({
  className = "",
  wrapperClassName = "",
  children,
  ...props
}: AppSelectProps) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <select
        {...props}
        className={`${SELECT_TRIGGER} h-10 w-full rounded-lg px-3 pr-10 text-sm ${className}`.trim()}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-current opacity-70"
      />
    </div>
  );
}
