import type { ReactNode } from "react";
import { Button } from "../ui/button";

type FormActionHeaderProps = {
  statusLabel?: string;
  statusControl?: ReactNode;
  cancelLabel: string;
  saveLabel: string;
  onCancel: () => void;
  onSave?: () => void;
  saveDisabled?: boolean;
  isPending?: boolean;
  className?: string;
  splitButtonsWhenNoStatus?: boolean;
};

export default function FormActionHeader({
  statusLabel,
  statusControl,
  cancelLabel,
  saveLabel,
  onCancel,
  onSave,
  saveDisabled,
  isPending,
  className = "",
  splitButtonsWhenNoStatus = false,
}: FormActionHeaderProps) {
  const hasStatusControl = Boolean(statusLabel || statusControl);
  const splitButtons = splitButtonsWhenNoStatus && !hasStatusControl;

  return (
    <div
      className={`${hasStatusControl ? "flex items-end gap-2" : "flex gap-2"} ${className}`.trim()}
    >
      {hasStatusControl ? (
        <div className="min-w-0 flex-1">
          {statusLabel ? (
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {statusLabel}
            </label>
          ) : null}
          {statusControl}
        </div>
      ) : null}
      <div
        className={`${splitButtons ? "grid flex-1 grid-cols-2" : "flex"} items-center justify-end gap-2`.trim()}
      >
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className={splitButtons ? "w-full" : ""}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={saveDisabled}
          className={splitButtons ? "w-full" : ""}
        >
          {isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : null}
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
