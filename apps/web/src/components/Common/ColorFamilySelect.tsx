import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  PRIMARY_COLOR_OPTIONS,
  type PrimaryColorFamily,
} from "../../theme/primaryColorFamilies";

interface ColorFamilySelectProps {
  value: PrimaryColorFamily;
  onChange: (value: PrimaryColorFamily) => void;
  label: string;
}

export default function ColorFamilySelect({
  value,
  onChange,
  label,
}: ColorFamilySelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(
    Math.max(
      0,
      PRIMARY_COLOR_OPTIONS.findIndex((option) => option.value === value),
    ),
  );
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () =>
      PRIMARY_COLOR_OPTIONS.find((option) => option.value === value) ??
      PRIMARY_COLOR_OPTIONS[0],
    [value],
  );

  useEffect(() => {
    const closeOnClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", closeOnClickOutside);
    return () => window.removeEventListener("mousedown", closeOnClickOutside);
  }, []);

  useEffect(() => {
    setActiveIndex(
      Math.max(
        0,
        PRIMARY_COLOR_OPTIONS.findIndex((option) => option.value === value),
      ),
    );
  }, [value]);

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(
        (prev) =>
          (prev + step + PRIMARY_COLOR_OPTIONS.length) %
          PRIMARY_COLOR_OPTIONS.length,
      );
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((prev) => !prev);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(
        (prev) =>
          (prev + step + PRIMARY_COLOR_OPTIONS.length) %
          PRIMARY_COLOR_OPTIONS.length,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const option = PRIMARY_COLOR_OPTIONS[activeIndex];
      if (option) {
        onChange(option.value);
        setOpen(false);
      }
    }
  };

  return (
    <div className="space-y-1.5" ref={rootRef}>
      <label className="block text-sm font-medium text-text-secondary">
        {label}
      </label>
      <button
        type="button"
        className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm inline-flex items-center justify-between gap-3"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="inline-flex items-center gap-2">
          <span
            className="h-3.5 w-3.5 rounded-sm border border-border"
            style={{ backgroundColor: `rgb(${selected.rgb})` }}
            aria-hidden
          />
          <span>{selected.label}</span>
        </span>
        <ChevronDown size={16} className="text-text-secondary" />
      </button>

      {open && (
        <div
          role="listbox"
          tabIndex={-1}
          className="max-h-64 overflow-auto rounded-lg border border-border bg-surface-elevated p-1 shadow-lg focus:outline-none"
          onKeyDown={onListKeyDown}
          aria-label={label}
        >
          {PRIMARY_COLOR_OPTIONS.map((option, index) => {
            const selectedOption = option.value === value;
            const active = index === activeIndex;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selectedOption}
                className={`w-full text-left px-2.5 py-2 rounded-md text-sm inline-flex items-center justify-between gap-3 ${
                  selectedOption
                    ? "bg-primary/20 text-primary"
                    : active
                      ? "bg-primary/10 text-text-primary"
                      : "text-text-secondary hover:bg-primary/10"
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 rounded-sm border border-border"
                    style={{ backgroundColor: `rgb(${option.rgb})` }}
                    aria-hidden
                  />
                  <span>{option.label}</span>
                </span>
                {selectedOption && <Check size={14} className="text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
