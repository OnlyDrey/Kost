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
}: FormActionHeaderProps) {
  const hasStatusControl = Boolean(statusLabel || statusControl);

  return (
    <div
      className={`${hasStatusControl ? "flex items-end gap-2" : "flex justify-end gap-2"} ${className}`.trim()}
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
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button type="button" onClick={onSave} disabled={saveDisabled}>
          {isPending ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : null}
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
