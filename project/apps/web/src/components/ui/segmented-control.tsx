import { FOCUS_RING } from "../Common/focusStyles";

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="inline-flex w-full rounded-lg border border-border bg-surface p-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 h-10 rounded-md px-3 text-sm font-medium transition-colors ${FOCUS_RING} ${selected ? "bg-primary/15 text-primary" : "text-text-secondary hover:bg-surface-elevated"}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
