import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { SELECT_TRIGGER } from "./focusStyles";
import {
  PRIMARY_COLOR_OPTIONS,
  type PrimaryColorFamily,
} from "../../theme/primaryColorFamilies";

interface ColorFamilySelectProps {
  value: PrimaryColorFamily;
  onChange: (value: PrimaryColorFamily) => void;
  label: string;
}

const COLOR_SWATCH_CLASS: Record<PrimaryColorFamily, string> = {
  slate: "bg-slate-500",
  gray: "bg-gray-500",
  zinc: "bg-zinc-500",
  neutral: "bg-neutral-500",
  stone: "bg-stone-500",
  red: "bg-red-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  yellow: "bg-yellow-500",
  lime: "bg-lime-500",
  green: "bg-green-500",
  emerald: "bg-emerald-500",
  teal: "bg-teal-500",
  cyan: "bg-cyan-500",
  sky: "bg-sky-500",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  purple: "bg-purple-500",
  fuchsia: "bg-fuchsia-500",
  pink: "bg-pink-500",
  rose: "bg-rose-500",
};

function ColorDot({ color }: { color: PrimaryColorFamily }) {
  return (
    <span
      className={`inline-flex h-3 w-3 rounded-full border border-black/10 dark:border-white/20 ${COLOR_SWATCH_CLASS[color]}`}
      aria-hidden
    />
  );
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
        className={`${SELECT_TRIGGER} h-10 w-full px-3.5 pr-10 text-sm inline-flex items-center gap-2`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onTriggerKeyDown}
      >
        <ColorDot color={selected.value} />
        <span className="truncate">{selected.label}</span>
        <span className="ml-auto inline-flex shrink-0 items-center justify-center text-current opacity-70">
          <ChevronDown size={16} />
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          tabIndex={-1}
          className="max-h-64 overflow-auto rounded-xl border border-border bg-surface p-1.5 shadow-xl focus:outline-none"
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
                className={`w-full text-left px-3 py-2 rounded-lg text-sm inline-flex items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
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
                <span className="inline-flex min-w-0 items-center gap-2">
                  <ColorDot color={option.value} />
                  <span className="truncate">{option.label}</span>
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
