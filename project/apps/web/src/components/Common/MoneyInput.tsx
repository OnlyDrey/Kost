import type { InputHTMLAttributes } from "react";

type CurrencyPlacement = "Before" | "After";

interface MoneyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  currencySymbol: string;
  symbolPosition?: CurrencyPlacement;
  inputClassName?: string;
}

export default function MoneyInput({
  currencySymbol,
  symbolPosition = "Before",
  className = "",
  inputClassName = "",
  ...props
}: MoneyInputProps) {
  const prefix = symbolPosition === "Before";

  return (
    <div
      className={`flex h-10 items-center rounded-lg border border-app-border bg-app-surface px-2.5 text-sm text-app-text-primary focus-within:ring-2 focus-within:ring-primary/45 ${className}`.trim()}
    >
      {prefix ? (
        <span className="mr-2 shrink-0 text-xs font-medium text-app-text-secondary">
          {currencySymbol}
        </span>
      ) : null}
      <input
        {...props}
        type="number"
        step={props.step ?? "0.01"}
        className={`w-full min-w-0 border-0 bg-transparent p-0 text-right text-sm font-semibold text-app-text-primary outline-none placeholder:text-app-text-secondary/60 ${inputClassName}`.trim()}
      />
      {!prefix ? (
        <span className="ml-2 shrink-0 text-xs font-medium text-app-text-secondary">
          {currencySymbol}
        </span>
      ) : null}
    </div>
  );
}
