import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from "react";
import { X } from "lucide-react";

interface AppDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  hideCloseButton?: boolean;
  titleIcon?: ReactNode;
}

const sizeClassMap: Record<NonNullable<AppDialogProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
};

export default function AppDialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  hideCloseButton = false,
  titleIcon,
}: AppDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    lastFocusedRef.current = document.activeElement as HTMLElement;

    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );

    const target = focusables?.[0] ?? panelRef.current;
    target?.focus();

    return () => {
      lastFocusedRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const handleTrapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;

    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );

    if (!focusables?.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onMouseDown={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`w-full ${sizeClassMap[size]} rounded-2xl border border-app-border bg-app-surface shadow-xl outline-none`}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
            return;
          }
          handleTrapFocus(event);
        }}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between gap-3 border-b border-app-border px-6 py-4">
          <h2
            id={titleId}
            className="text-xl font-semibold text-app-text-primary inline-flex items-center gap-2"
          >
            {titleIcon}
            {title}
          </h2>
          {!hideCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-app-text-secondary transition-colors hover:bg-app-surface-elevated hover:text-app-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {(description || children) && (
          <div
            id={description ? descriptionId : undefined}
            className="space-y-4 px-6 py-5 text-app-text-secondary"
          >
            {description && (
              <div className="text-sm sm:text-base leading-relaxed">
                {description}
              </div>
            )}
            {children}
          </div>
        )}

        {footer && (
          <div className="flex flex-wrap justify-end gap-3 border-t border-app-border px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
